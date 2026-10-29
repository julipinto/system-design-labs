// Figura 3D (iso-glow): o que o balanceador enxerga. O pedido da Lena (Recife) para loja.com.br vira um envelope
// em 4 camadas (IP, TCP, TLS, HTTP), como no módulo 1: o L4 lê só as de fora, o L7 tira o TLS e lê o HTTP.
// Cena: na frente, o aparelho de entrada (NGINX, lb-loja ou o Envoy do laboratório); atrás, a coluna de destinos
// (pagamentos, catalogo-1/2/3, catalogo/carrinho/pedidos ou os 3 proxies e as 3 apps). Ao fundo, à direita, o mostrador
// com o que o balanceador vê e os contadores. Mensagens correm nas vigas com o dado real (POST /pagamentos, 413, GET /produtos/42…).
// Cenários (toggle e ?mode=proxy|l4|l7|lab; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/load-balancers-brief.md) e o envoy-patterns do repositório público do autor.
FIGS3D.push({ id: 'camadas', name: 'Layers', mod: (() => {
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
  const fmt = v => Number.isInteger(+v.toFixed(2)) ? String(Math.round(v)) : (+v.toFixed(2)).toString();

  // ── cenários ──
  const SC = ['proxy', 'l4', 'l7', 'lab'];
  const SCNAME = { proxy: 'Proxy', l4: 'L4', l7: 'L7', lab: 'Lab' };
  const SCFULL = { proxy: 'Proxy 1:1 × LB 1:N', l4: 'Layer 4 (L4)', l7: 'Layer 7 (L7)', lab: 'Envoy lab' };
  const AULA = { proxy: 'aula-2-load-balancer-vs-proxy-reverso', l4: 'aula-8-camadas-4-e-7', l7: 'aula-8-camadas-4-e-7', lab: 'aula-10-laboratorio-envoy' };
  let clk = 0, sc = 'l7', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-camadas3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7;
  plateWith(g0, 740, 430, [[14, 14], [726, 14], [14, 416], [726, 416]]);
  hazeAndShadow(g0, 370, 215, 8.8, 5.6);
  // mostrador ao fundo, à direita (fora do caminho do envelope)
  rbox(470, 12, PL, 252, 12, 128, 5, bodyMat, g0);
  const scr = faceCanvas('front', 474, 24, PL + 124, 244, 118, 5, g0);
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário; nome e endereço mudam por cenário
  function block(w, d, h) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    return { g, mat, top, fr, fh, w, d, h, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const B = { dev: block(176, 110, 32), pag: block(176, 110, 32), r1: block(176, 70, 26), r2: block(176, 70, 26), r3: block(176, 70, 26),
    a1: block(140, 70, 26), a2: block(140, 70, 26), a3: block(140, 70, 26) };
  const NAMES = Object.keys(B);
  // o envelope: 4 placas empilhadas como no módulo 1 (IP embaixo, HTTP em cima); a placa lida acende
  const LAYERS = ['ip', 'tcp', 'tls', 'http'], EW = 176, ED = 62, ETH = 7, EZ0 = 52, EG = 40;
  const SLAB = {};
  LAYERS.forEach(k => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, EW, ED, ETH, 4, mat, g); const top = faceCanvas('top', 2, 2, ETH, EW - 4, ED - 4, 6, g);
    SLAB[k] = { g, mat, top, key: '', pos: null, from: null, to: null, t0: 0 }; });
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 48 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 6 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.on ? 5.5 : 3.5) * TS, d = C_.clone().sub(A), len = d.length();
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
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
  const TAGS = [tag(12), tag(12)], MSGS = [tag(11), tag(11)], WHO = tag(11);

  // ── lugares e rotas (no chão, z = 10) ──
  const Z = 10, CY = [185, 275, 365], EY = [250, 275, 300];
  const LAY = {
    one: { dev: [190, 220], pag: [480, 220] },
    lb: { dev: [190, 220], r1: [480, 150], r2: [480, 240], r3: [480, 330] },
    lab: { dev: [120, 220], r1: [350, 150], r2: [350, 240], r3: [350, 330], a1: [560, 150], a2: [560, 240], a3: [560, 330] },
  };
  const R = {
    in: x => [[-70, 275, Z], [x, 275, Z]],
    pag: [[366, 275, Z], [480, 275, Z]],
    out: (k, x0, x1) => { const m = (x0 + x1) / 2; return k === 1 ? [[x0, 275, Z], [x1, 275, Z]] : [[x0, EY[k], Z], [m, EY[k], Z], [m, CY[k], Z], [x1, CY[k], Z]]; },
    app: k => [[526, CY[k], Z], [560, CY[k], Z]],
  };
  const rev = pts => pts.slice().reverse();
  const ROUT = k => R.out(k, 366, 480), LOUT = k => R.out(k, 296, 350);
  // balões: na faixa livre à frente ou à direita do bloco (nunca em cima do texto dele)
  const ABOVE = { dev: [278, 372, 16], ldev: [208, 372, 16], pag: [568, 372, 16], who: [-40, 345, 16],
    r1: [722, 185, 26], r2: [722, 275, 26], r3: [722, 365, 26], lr2: [438, 420, 16], a2: [760, 275, 26] };
  // o envelope fica atrás do aparelho (y menor), para não cobrir o texto do topo dele
  const ENV = { lena: [12, 122], dev: [196, 122] };

  // ── conteúdo dos blocos ──
  const DOWN = [['', 6.8], ['DOWN', 12, 'bad'], ['no response', 8, 'dim']];
  const rep = k => [`catalogo-${k + 1}`, `10.0.1.1${k + 1}:8080`];
  const repRows = (n, ms, extra) => [['catalog replica', 6.8, 'dim'], [`${n} ${n === 1 ? 'request' : 'requests'}`, 10, n ? 'hi' : 'dim'], extra || [ms != null ? `work: ${ms} ms` : 'ready', 8, 'dim']];
  const ROUTES = ['/produtos/* → catalogo', '/carrinho/* → carrinho', '/pedidos/*  → pedidos'];
  const routeRows = (lit, extra) => [['rules by path', 6.8, 'dim'], ...ROUTES.map((r, i) => [r, 8.4, i === lit ? 'acc' : 'hi']), ...(extra ? [extra] : [])];
  const PEDIDO = { cat: 'GET /produtos/42', search: 'GET /busca?q=pelucia&ordem=preco', carr: 'GET /carrinho/itens', ped: 'POST /pedidos/novo' };

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const o = { lay: sc === 'proxy' ? 'one' : sc === 'lab' ? 'lab' : 'lb', lab: {}, on: {}, rows: {}, beams: [], tags: [], msgs: [], env: null,
      who: sc === 'lab' ? 'terminal · curl' : 'Lena · Recife', cmd: [], res: [], scr: { head: '', rows: [], foot: '' }, count: ['0', '', ''] };
    if (sc === 'proxy') { o.lab.dev = ['NGINX', '203.0.113.20']; o.lab.pag = ['pagamentos', '10.0.2.21:8080'];
      o.rows.dev = [['reverse proxy 1:1', 6.8, 'dim'], ['terminates TLS', 9.5], ['upload up to 1 MB', 9.5], ['hides 10.0.2.21', 9.5]];
      o.rows.pag = [['single server', 6.8, 'dim'], ['only talks to NGINX', 9], ['internal network', 9, 'dim']]; }
    if (sc === 'l4' || sc === 'l7' || sc === 'proxy') { o.lab.dev = o.lab.dev || ['lb-loja', '203.0.113.10']; [0, 1, 2].forEach(k => { o.lab['r' + (k + 1)] = rep(k); o.rows['r' + (k + 1)] = repRows(0); }); }
    if (sc === 'l4') o.rows.dev = [['layer 4 (L4)', 6.8, 'dim'], ['reads IP and port', 10], ['does not open TLS', 9, 'dim']];
    if (sc === 'l7') { o.lab.r1 = ['catalogo', '3 replicas']; o.lab.r2 = ['carrinho', 'service']; o.lab.r3 = ['requests', 'service'];
      o.rows.dev = routeRows(-1); o.rows.r1 = [['10.0.1.11 · .12 · .13', 7, 'dim'], ['0 requests', 10, 'dim'], ['/produtos/*', 8, 'dim']];
      o.rows.r2 = [['service from module 6', 6.8, 'dim'], ['0 requests', 10, 'dim'], ['/carrinho/*', 8, 'dim']]; o.rows.r3 = [['service from module 6', 6.8, 'dim'], ['0 requests', 10, 'dim'], ['/pedidos/*', 8, 'dim']]; }
    if (sc === 'lab') { o.lab.dev = ['load-balancer', 'Envoy :80'];
      o.rows.dev = [['lb_policy', 6.8, 'dim'], ['ROUND_ROBIN', 10.5, 'acc'], ['health_checks', 7.4, 'dim'], ['/health every 10 s', 8.4]];
      [0, 1, 2].forEach(k => { o.lab['r' + (k + 1)] = [`reverse-proxy-${k + 1}`, `:808${k + 1}`]; o.lab['a' + (k + 1)] = [`backend-app-${k + 1}`, ':3000'];
        o.rows['r' + (k + 1)] = [['Envoy · reverse proxy', 6.8, 'dim'], [`→ backend-app-${k + 1}`, 9], ['0 curls', 8, 'dim']];
        o.rows['a' + (k + 1)] = [['Node.js · Express', 6.8, 'dim'], ['GET / → JSON', 9], ['"service": …', 8, 'dim']]; }); }
    return o;
  }
  const routesOf = o => o.lay === 'one' ? [R.in(190), R.pag] : o.lay === 'lb' ? [R.in(190), ...[0, 1, 2].map(ROUT)] : [R.in(120), ...[0, 1, 2].flatMap(k => [LOUT(k), R.app(k)])];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : ABOVE[at]), text, tone]);
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); o.msgs.push([pts, ease(f), text, tone]); }
    return f >= 1;
  }
  // ida e volta passando pelo aparelho da frente: Lena → dev → destino → dev → Lena (2,5 s)
  function trip(o, t, a, pIn, pOut, txIn, txOut, txBack, tnBack = 'acc') {
    const s1 = send(o, t, a, a + 0.6, pIn, txIn, 'hi', 0.05);
    const s2 = pOut ? send(o, t, a + 0.65, a + 1.25, pOut, txOut, 'hi', 0.05) : s1;
    const s3 = pOut ? send(o, t, a + 1.3, a + 1.85, rev(pOut), txBack, tnBack, 0.05) : s2;
    const s4 = send(o, t, a + (pOut ? 1.9 : 0.7), a + (pOut ? 2.5 : 1.3), rev(pIn), txBack, tnBack, 0.4);
    return [s1, s2, s3, s4];
  }
  const env = (o, at, st = {}, extra = {}) => { o.env = { at, st: { ip: '', tcp: '', tls: 'seal', http: 'skip', ...st }, note: {}, http: [PEDIDO.cat + ' HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…'], show: 4, ...extra }; return o.env; };
  const SEES4 = [['IP 177.38.20.5 → .10', 'sees', 'acc'], ['TCP 51514 → 443', 'sees', 'acc'], ['TLS (encrypted)', 'passes on', 'dim'], ['GET /produtos/42', 'does not see', 'bad']];
  const SEES7 = [['IP 177.38.20.5 → .10', 'sees', 'acc'], ['TCP 51514 → 443', 'sees', 'acc'], ['TLS', 'terminates here', 'acc'], ['GET /produtos/42', 'sees', 'acc']];
  const cntMs = (o, ms, n) => { o.count = [`${fmt(ms)} ms`, 'spent in the balancer', `· ${n} ${n === 1 ? 'request' : 'requests'}`]; };
  const cntOk = (o, ok, err) => { o.count = [String(ok), ok === 1 ? 'request served' : 'requests served', `· ${err} with errors`]; };
  const cntLab = (o, c, e) => { const n = c[0] + c[1] + c[2] + e; o.count = [String(n), n === 1 ? 'curl' : 'curls', `· proxy-1 ${c[0]} / proxy-2 ${c[1]} / proxy-3 ${c[2]} / hung ${e}`]; };
  const labScr = (o, c, e, foot) => { o.scr = { head: 'LOAD-BALANCER · ROUND_ROBIN', rows: [0, 1, 2].map(k => [`reverse-proxy-${k + 1}`, `${c[k]} ${c[k] === 1 ? 'curl' : 'curls'}`, c[k] ? 'acc' : 'dim'])
    .concat([['hung', String(e), e ? 'bad' : 'dim']]), foot: foot || '' }; cntLab(o, c, e); };
  const lbScr = (o, c, foot, bad = -1) => { o.scr = { head: 'LB-LOJA · 203.0.113.10', rows: [0, 1, 2].map(k => [`catalogo-${k + 1}`, k === bad ? c[k] : `${c[k]} ${c[k] === 1 ? 'request' : 'requests'}`, k === bad ? 'bad' : c[k] ? 'acc' : 'dim']), foot: foot || '' }; };

  const STEPS = {
    proxy: [
      { id: 'tls', dur: 4.5, title: 'Lena talks to NGINX, not to pagamentos',
        story: 'Lena finishes buying the plush cat and her browser sends the payment to pagamentos.loja.com.br. An NGINX at IP 203.0.113.20 answers, in front of a single server, pagamentos. NGINX holds the certificate, terminates TLS and reads the request in plain text.',
        look: 'The request leaves Lena encrypted and lights up NGINX; pagamentos, behind it, stays dark.',
        key: 'Reverse proxy: an intermediary in front of the server, answering the client in its place.',
        f(o, t) { o.cmd = ['POST /pagamentos HTTP/1.1', 'Host: pagamentos.loja.com.br', '(arrives encrypted, inside TLS)']; cntOk(o, 0, 0);
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['TLS', 'waiting…', 'dim'], ['requests received', '0', 'dim'], ['forwarded', '0', 'dim']], foot: 'pagamentos: 10.0.2.21:8080' };
          if (send(o, t, 0.3, 1.3, R.in(190), 'POST /pagamentos · encrypted', 'hi', 0.3)) { o.on.dev = 1;
            o.rows.dev = [['reverse proxy 1:1', 6.8, 'dim'], ['TLS terminated ✓', 9.5, 'acc'], ['POST /pagamentos', 9.5], ['hides 10.0.2.21', 9.5]];
            o.scr.rows = [['TLS', 'terminates here', 'acc'], ['requests received', '1', 'acc'], ['forwarded', '0', 'dim']]; o.res = ['(NGINX decrypted and read the request)']; }
          if (t > 1.8) T(o, 'dev', 'certificate for\npagamentos.loja.com.br'); } },
      { id: 'esconde', dur: 5, title: 'Forwards inward and hides the IP',
        story: 'NGINX opens another connection to pagamentos, at the internal address 10.0.2.21:8080, and forwards the request with the header X-Forwarded-For: 177.38.20.5, so pagamentos knows who the customer is. The response comes back the same way. Lena only knows 203.0.113.20; 10.0.2.21 never leaves the store\'s network.',
        look: 'The light crosses NGINX to pagamentos and comes back; the internal IP only shows on the inside.',
        key: 'The client only sees the proxy; the real server stays hidden behind it.',
        f(o, t) { o.cmd = ['POST /pagamentos HTTP/1.1', 'Host: pagamentos.loja.com.br', 'X-Forwarded-For: 177.38.20.5']; o.on.dev = 1; cntOk(o, 0, 0);
          o.rows.dev = [['reverse proxy 1:1', 6.8, 'dim'], ['TLS terminated ✓', 9.5, 'acc'], ['→ 10.0.2.21:8080', 9.5], ['+ X-Forwarded-For', 9.5]];
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['TLS', 'terminates here', 'acc'], ['requests received', '1', 'acc'], ['forwarded', '0', 'dim']], foot: 'Lena sees: 203.0.113.20' };
          if (send(o, t, 0.3, 1.2, R.pag, 'POST · X-Forwarded-For', 'hi', 0.1)) { o.on.pag = 1; o.scr.rows[2] = ['forwarded', '1', 'acc'];
            o.rows.pag = [['from: NGINX (internal network)', 6.8, 'dim'], ['POST /pagamentos', 9.5, 'acc'], ['client: 177.38.20.5', 8.6]]; }
          if (send(o, t, 1.6, 2.4, rev(R.pag), '200 OK', 'acc', 0.05)) o.res = ['HTTP/1.1 200 OK', '(comes back through NGINX)'];
          if (send(o, t, 2.5, 3.3, rev(R.in(190)), '200 OK · from 203.0.113.20', 'acc', 0.4)) { cntOk(o, 1, 0); o.on.pag = 2; }
          if (t > 3.0) { T(o, 'who', 'Lena only sees\n203.0.113.20', 'hi'); T(o, 'pag', 'IP 10.0.2.21\nnever leaves the network'); } } },
      { id: 'limite', dur: 4.5, title: 'Blocks a 5 MB upload at the door',
        story: 'A bot tries to overload pagamentos with a 5 MB POST. NGINX accepts at most 1 MB of body (client_max_body_size 1m) and answers 413 without forwarding anything. pagamentos never finds out: the junk stops at the door.',
        look: 'The large request reaches NGINX in red and comes back with 413; the beam to pagamentos stays dark.',
        key: 'The proxy applies rules at the entrance (size, TLS, cache) before the server spends any work.',
        f(o, t) { o.who = 'bot · 5 MB'; o.cmd = ['POST /pagamentos HTTP/1.1', 'Content-Length: 5242880  (5 MB)']; cntOk(o, 1, 0);
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['body limit', '1 MB', 'acc'], ['arrived', '5 MB', 'bad'], ['forwarded', '0', 'dim']], foot: '' };
          if (send(o, t, 0.3, 1.3, R.in(190), 'POST · 5 MB', 'bad', 0.2)) { o.on.dev = 'bad';
            o.rows.dev = [['reverse proxy 1:1', 6.8, 'dim'], ['5 MB > 1 MB', 10, 'bad'], ['answers 413', 9.5, 'bad'], ['does not forward', 9.5]]; }
          if (send(o, t, 1.6, 2.5, rev(R.in(190)), '413 · too large', 'bad', 0.5)) { o.res = ['HTTP/1.1 413 Request Entity Too Large']; cntOk(o, 1, 1); o.scr.foot = 'pagamentos: nothing arrived'; }
          if (t > 2.5) T(o, 'pag', 'pagamentos: 0 bytes\nnever even knew', 'hi'); } },
      { id: 'lb', dur: 7, title: '1:N: lb-loja in front of 3 replicas',
        story: 'pagamentos has a single server, so its NGINX is 1:1. The catalog runs on 3 replicas, and lb-loja, at IP 203.0.113.10, stands in front of them. Lena, Bia and Caio arrive, and lb-loja sends one request to each replica: 1, 2, 3.',
        look: 'NGINX gives way to lb-loja; three requests leave it, one for each catalog replica.',
        key: 'A reverse proxy is one in front of one (1:1); a load balancer is one in front of many (1:N). The same tool plays both roles.',
        f(o, t) { o.lay = 'lb'; o.lab.dev = ['lb-loja', '203.0.113.10']; o.rows.dev = [['load balancer 1:N', 6.8, 'dim'], ['pool: 3 replicas', 9.5], ['catalogo-1, 2, 3', 9.5]];
          const who = ['Lena', 'Bia', 'Caio'], what = ['cat', 'search', 'cat'], c = [0, 0, 0];
          [0, 1, 2].forEach(k => { const a = 0.5 + k * 1.9, s = trip(o, t, a, R.in(190), ROUT(k), `P${k + 1} ${who[k]} · ${what[k]}`, PEDIDO[what[k]].slice(0, 16), '200 OK');
            if (s[1]) { c[k] = 1; o.on['r' + (k + 1)] = t < a + 2.5 ? 1 : 2; o.rows['r' + (k + 1)] = repRows(1, what[k] === 'search' ? 900 : 20); }
            if (t > a && t < a + 2.5) o.on.dev = 1; });
          const n = c[0] + c[1] + c[2]; cntOk(o, n, 0); lbScr(o, c, n === 3 ? 'one request for each' : '');
          o.cmd = [n ? PEDIDO[what[n - 1]] + ' HTTP/1.1' : PEDIDO.cat + ' HTTP/1.1', 'Host: loja.com.br']; if (n) o.res = [`→ catalogo-${n} (10.0.1.1${n}:8080)`];
          if (t > 6.2) T(o, 'dev', '1 entry · 3 replicas'); } },
      { id: 'cai1', dur: 6.5, title: 'What if it fails: pagamentos goes down',
        story: 'Back to pagamentos, which went down at 20:00:00. NGINX tries to forward, nobody answers, and it returns 502 Bad Gateway. There is no other server to try: with 1:1, the proxy hides the server but does not replace it. The payments of Lena, Bia and Caio fail, and will keep failing until it comes back.',
        look: 'pagamentos turns red; each request reaches NGINX, hits the cut beam and comes back 502.',
        key: 'A 1:1 proxy protects and organizes the entrance, but gives no redundancy.',
        f(o, t) { o.rows.pag = DOWN; o.on.pag = 'bad'; o.cmd = ['POST /pagamentos HTTP/1.1', 'Host: pagamentos.loja.com.br']; let e = 0;
          const who = ['Lena', 'Bia', 'Caio'];
          [0, 1, 2].forEach(k => { const a = 0.4 + k * 1.9;
            if (send(o, t, a, a + 0.6, R.in(190), `${who[k]} · POST /pagamentos`, 'hi', 0.05)) { if (t < a + 1.3) o.beams.push({ pts: R.pag, on: true, tone: 'bad', cut: 0.5 }); }
            if (send(o, t, a + 0.8, a + 1.4, rev(R.in(190)), '502 Bad Gateway', 'bad', 0.3)) e = k + 1;
            if (t > a && t < a + 1.6) o.on.dev = 1; });
          cntOk(o, 0, e); if (e) o.res = ['HTTP/1.1 502 Bad Gateway'];
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['pagamentos', 'down', 'bad'], ['other server\', \'none', 'bad'], ['502s returned', String(e), e ? 'bad' : 'dim']], foot: '20:00:00 · 100% fail' };
          if (t > 5.5) T(o, 'pag', '1:1 · nobody to\ntake over', 'bad'); } },
      { id: 'cai2', dur: 9, title: 'With 1:N, one replica goes down and the store keeps running',
        story: 'Now the same accident in the catalog: catalogo-2 hangs at 20:00:00. Until the healthcheck notices, 1 of every 3 requests lands on it and fails (502/504). At 20:00:15, after 3 failed checks, it leaves the pool and 100% of requests go to catalogo-1 and catalogo-3. The store keeps selling.',
        look: 'catalogo-2 turns red; Lena\'s request fails on it, and after 20:00:15 the light goes only to 1 and 3.',
        key: 'With several replicas behind it, the balancer works around the one that went down; that is what 1:1 does not have.',
        f(o, t) { o.lay = 'lb'; o.lab.dev = ['lb-loja', '203.0.113.10']; o.rows.r2 = DOWN; o.on.r2 = 'bad';
          const Q = [['P4 Davi', 0, 'cat'], ['P5 Lena', 1, 'search'], ['P6 Bia', 2, 'cat'], ['P7 Caio', 0, 'cat'], ['P8 Davi', 2, 'search'], ['P9 Lena', 0, 'cat']], c = [0, 0, 0], ms = [0, 0, 0];
          let ok = 0, e = 0, out = t > 4.4;
          o.rows.dev = out ? [['pool', 6.8, 'dim'], ['catalogo-1 ✓', 9.5, 'acc'], ['catalogo-2 out', 9.5, 'bad'], ['catalogo-3 ✓', 9.5, 'acc']] : [['pool', 6.8, 'dim'], ['catalogo-1 ✓', 9.5], ['catalogo-2 ✓ ?', 9.5], ['catalogo-3 ✓', 9.5]];
          Q.forEach(([nm, k, w], i) => { const a = i < 3 ? 0.3 + i * 1.3 : 4.8 + (i - 3) * 1.3;
            if (send(o, t, a, a + 0.5, R.in(190), `${nm} · ${w}`, 'hi', 0.05)) {
              if (k === 1) { if (t < a + 1.2) o.beams.push({ pts: ROUT(1), on: true, tone: 'bad', cut: 0.6 }); if (send(o, t, a + 0.7, a + 1.2, rev(R.in(190)), '504 · catalogo-2', 'bad', 0.4)) e++; }
              else if (send(o, t, a + 0.55, a + 1.05, ROUT(k), PEDIDO[w].slice(0, 16), 'hi', 0.2)) { c[k]++; ms[k] += w === 'search' ? 900 : 20; ok++; o.on['r' + (k + 1)] = t < a + 1.4 ? 1 : 2; } }
            if (t > a && t < a + 1.2) o.on.dev = 1; });
          o.rows.r1 = repRows(c[0], ms[0]); o.rows.r3 = repRows(c[2], ms[2]);
          cntOk(o, ok, e); lbScr(o, c, out ? '20:00:15 · catalogo-2 out of the pool' : '20:00:00 · catalogo-2 hung', 1);
          o.scr.rows[1][1] = out ? 'out of pool' : e ? `${e} error` : 'hung'; o.cmd = ['GET /health  (every 5 s, timeout 1 s)'];
          o.res = t < 4.4 ? ['20:00:05 ✕  20:00:10 ✕  20:00:15 ✕'.slice(0, t < 1.5 ? 11 : t < 3 ? 22 : 34)] : ['3 failures in a row → out of the pool'];
          if (t > 3.8 && t < 5.4) T(o, 'r2', '3 checks failed\n20:00:15 · out of the pool', 'bad');
          if (t > 8.2) T(o, 'dev', 'P4–P9: 5 ok, 1 error\nthe store kept going'); } },
    ],
    l4: [
      { id: 'camadas', dur: 5, title: 'Lena\'s request, in 4 layers',
        story: 'Lena opens the plush cat page: GET /produtos/42 on loja.com.br. Before leaving the phone, the request gains layers, as in module 1. HTTP goes inside TLS, which encrypts everything; on the outside, TCP adds the ports (51514 → 443) and IP adds the addresses (177.38.20.5 → 203.0.113.10).',
        look: 'The envelope builds up next to Lena, from top to bottom: HTTP, TLS (crossed out, because it is encrypted), TCP and IP.',
        key: 'The deeper the balancer opens the envelope, the more it knows and the more work it does.',
        f(o, t) { const n = clamp(Math.floor((t - 0.3) / 0.8) + 1, 0, 4), E = env(o, 'lena', { http: '', tls: 'seal', tcp: '', ip: '' }, { show: n });
          E.note = { http: 'the request', tls: 'encrypts the one above', tcp: 'ports', ip: 'addresses' }; [...LAYERS].reverse().forEach((k, i) => { if (i === n - 1 && t < 0.3 + n * 0.8) E.st[k] = 'read'; });
          o.cmd = ['GET /produtos/42 HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…']; o.res = n >= 4 ? ['goes over the wire as:', 'TCP 177.38.20.5:51514 → 203.0.113.10:443'] : []; cntMs(o, 0, 0);
          o.scr = { head: 'LB-LOJA · 203.0.113.10', rows: [['mode', 'layer 4', 'acc'], ['requests', '0', 'dim']], foot: 'waiting for the envelope' };
          if (t > 3.8) T(o, 'who', 'built on the phone\nbefore leaving', 'hi'); } },
      { id: 'le', dur: 5, title: 'L4 reads only IP and port',
        story: 'The envelope reaches lb-loja, which works at layer 4. It reads the two outer headers: IP 177.38.20.5 → 203.0.113.10 and TCP 51514 → 443. Everything inside is encrypted, and L4 does not even try to open it: it does not know whether it is the plush cat page, the cart or an order.',
        look: 'IP and TCP light up on the envelope; TLS and HTTP stay dark, marked "does not open" and "L4 does not see".',
        key: 'Layer 4 (L4): decides with IP and port only, without reading the request.',
        f(o, t) { const at = t > 1.3 ? 'dev' : 'lena', E = env(o, at); send(o, t, 0.3, 1.3, R.in(190), 'TCP :51514 → :443', 'hi', 0.3); cntMs(o, 0, 0);
          o.cmd = ['TCP 177.38.20.5:51514 → 203.0.113.10:443', '(the rest goes encrypted)'];
          o.scr = { head: 'LB-LOJA · L4 · WHAT IT SEES', rows: SEES4.map(r => t > 1.6 ? r : [r[0], '…', 'dim']), foot: '' };
          if (t > 1.6) { o.on.dev = 1; E.st.ip = E.st.tcp = 'read'; E.note = { ip: 'L4 reads ✓', tcp: 'L4 reads ✓', tls: 'does not open', http: 'L4 does not see' };
            o.rows.dev = [['layer 4 (L4)', 6.8, 'dim'], ['177.38.20.5:51514', 9.5, 'acc'], ['→ :443', 9.5, 'acc'], ['the rest: encrypted', 8.6, 'dim']]; o.res = ['L4 knows: where it comes from and which port'];
            o.scr.foot = 'decides with IP and port only'; }
          if (t > 2.6) T(o, 'dev', 'reads 2 of 4 layers'); } },
      { id: 'passes on', dur: 5, title: 'Picks the replica and forwards the connection',
        story: 'With IP and port, lb-loja picks a replica (here, it is catalogo-1\'s turn, 10.0.1.11:8080) and forwards the whole connection, as it came. The replica itself terminates TLS, so the loja.com.br certificate must be on all 3. The balancer\'s work was small: +0.1 ms.',
        look: 'The connection, still encrypted, goes from lb-loja to catalogo-1, which lights up and opens TLS itself.',
        key: 'L4 forwards the connection; the replica reads the HTTP.',
        f(o, t) { const E = env(o, 'dev', { ip: 'read', tcp: 'read' }); E.note = { ip: 'L4 reads ✓', tcp: 'L4 reads ✓', tls: 'goes sealed', http: 'L4 does not see' }; o.on.dev = 1; cntMs(o, 0, 0);
          o.rows.dev = [['layer 4 (L4)', 6.8, 'dim'], ['turn: catalogo-1', 9.5, 'acc'], ['forwards the connection', 9], ['+0.1 ms', 9, 'acc']];
          o.cmd = ['TCP 177.38.20.5:51514 → 10.0.1.11:8080', '(same bytes, still encrypted)'];
          o.scr = { head: 'LB-LOJA · L4 · WHAT IT SEES', rows: SEES4, foot: '' };
          if (send(o, t, 0.4, 1.5, ROUT(0), 'whole connection · encrypted', 'hi', 0.3)) { o.on.r1 = 1; cntMs(o, 0.1, 1); o.scr.foot = '+0.1 ms on this request';
            o.rows.r1 = [['received the connection', 6.8, 'dim'], ['terminates TLS', 10, 'acc'], ['reads GET /produtos/42', 8.6]]; o.res = ['catalogo-1 decrypts and reads: GET /produtos/42']; }
          if (send(o, t, 2.2, 3.0, rev(ROUT(0)), '200 · plush cat page', 'acc', 0.05)) o.on.r1 = 2; send(o, t, 3.05, 3.7, rev(R.in(190)), '200 · plush cat page', 'acc', 0.6);
          if (t > 2.2) T(o, 'r1', 'certificate here\n(on all 3 replicas)'); } },
      { id: 'mesma', dur: 6, title: 'What if it fails: the cart lands on the catalog',
        story: 'Lena puts the plush cat in the cart. The browser reuses the same connection (keep-alive) and sends GET /carrinho/itens over it. To L4 it is the same connection as before, so it goes to the same catalogo-1, which has no cart at all: 404. L4 cannot send /carrinho to the carrinho service, because it never saw the path.',
        look: 'The second request follows the same beam to catalogo-1 and comes back red, with 404.',
        key: 'L4 does not route by path: everything that comes on one connection goes to the same place.',
        f(o, t) { const E = env(o, t > 1.0 ? 'dev' : 'lena', { ip: 'read', tcp: 'read' }, { http: [PEDIDO.carr + ' HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…'] });
          E.note = { ip: 'same connection', tcp: 'same :51514', tls: 'does not open', http: 'L4 does not see' }; cntMs(o, 0.1, 1);
          o.cmd = ['same connection 177.38.20.5:51514 (keep-alive)', 'inside, encrypted: GET /carrinho/itens'];
          o.scr = { head: 'LB-LOJA · L4 · WHAT IT SEES', rows: [['IP 177.38.20.5 → .10', 'same', 'acc'], ['TCP 51514 → 443', 'same', 'acc'], ['path /carrinho', 'does not see', 'bad'], ['destination', 'catalogo-1', 'hi']], foot: '' };
          o.rows.r1 = [['same connection', 6.8, 'dim'], ['GET /produtos/42 ✓', 9], ['', 8]];
          const s = trip(o, t, 0.3, R.in(190), ROUT(0), 'GET /carrinho/itens · encrypted', 'same connection', '404 Not Found', 'bad');
          if (t > 0.3 && t < 2.8) o.on.dev = 1;
          if (s[1]) { cntMs(o, 0.2, 2); o.on.r1 = 'bad'; o.rows.r1 = [['same connection', 6.8, 'dim'], ['GET /produtos/42 ✓', 9], ['/carrinho/itens? 404', 9, 'bad']]; o.res = ['HTTP/1.1 404 Not Found (from catalogo-1)']; o.scr.foot = 'carrinho: never received it'; }
          if (t > 3.2) T(o, 'r1', 'catalog has no cart\nL4 never saw the path', 'bad'); } },
    ],
    l7: [
      { id: 'abre', dur: 5.5, title: 'L7 terminates TLS and opens the request',
        story: 'Now lb-loja works at layer 7. The loja.com.br certificate is on it, so it terminates TLS: it decrypts the envelope and reads the whole HTTP. GET /produtos/42, Host: loja.com.br and Lena\'s session Cookie are all in the balancer\'s view.',
        look: 'The TLS layer leaves the envelope and HTTP lights up, with the request written out in full.',
        key: 'Terminating TLS: the balancer decrypts the request so it can read the HTTP.',
        f(o, t) { const at = t > 1.3 ? 'dev' : 'lena', E = env(o, at); send(o, t, 0.3, 1.3, R.in(190), 'TLS · encrypted', 'hi', 0.3); cntMs(o, 0, 0);
          o.cmd = ['TCP 177.38.20.5:51514 → 203.0.113.10:443', '(inside TLS: still encrypted)'];
          o.scr = { head: 'LB-LOJA · L7 · WHAT IT SEES', rows: SEES4.map(r => [r[0], '…', 'dim']), foot: '' };
          if (t > 1.6) { o.on.dev = 1; E.st.ip = E.st.tcp = 'read'; E.st.tls = 'read'; E.note = { ip: 'reads ✓', tcp: 'reads ✓', tls: 'decrypting…', http: '' }; o.scr.rows = SEES7.map((r, i) => i < 2 ? r : [r[0], '…', 'dim']); }
          if (t > 2.6) { E.st.tls = 'gone'; E.st.http = 'read'; E.note = { ip: 'reads ✓', tcp: 'reads ✓', http: 'L7 reads ✓' }; o.scr.rows = SEES7; o.scr.foot = 'loja.com.br certificate here';
            o.cmd = ['GET /produtos/42 HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…']; o.res = ['TLS terminated at lb-loja']; o.rows.dev = routeRows(-1); }
          if (t > 3.2) T(o, 'dev', 'certificate for\nloja.com.br'); } },
      { id: 'rota', dur: 5, title: 'Reads the path and picks the service',
        story: 'With the request open, lb-loja checks the path against the rules: /produtos/* goes to catalogo, /carrinho/* to carrinho and /pedidos/* to pedidos, the services from module 6. /produtos/42 matches the first rule, and the request goes to the catalogo pool (here, catalogo-1, 10.0.1.11:8080).',
        look: 'The /produtos/* rule lights up on lb-loja and the light goes only to catalogo.',
        key: 'Layer 7 (L7): decides by the content of the request, such as the URL path.',
        f(o, t) { const E = env(o, 'dev', { tls: 'gone', http: 'read' }); E.note = { http: 'L7 reads ✓' }; o.on.dev = 1; cntMs(o, 0, 0);
          o.cmd = ['GET /produtos/42 HTTP/1.1', 'Host: loja.com.br']; o.rows.dev = routeRows(t > 0.6 ? 0 : -1);
          o.scr = { head: 'LB-LOJA · L7 · ROUTES', rows: [['catalogo', '0', 'dim'], ['carrinho', '0', 'dim'], ['requests', '0', 'dim']], foot: t > 0.6 ? '/produtos/42 matches /produtos/*' : '' };
          if (send(o, t, 1.0, 2.0, ROUT(0), 'GET /produtos/42', 'hi', 0.1)) { o.on.r1 = 1; cntMs(o, 1, 1); o.scr.rows[0] = ['catalogo', '1 request', 'acc']; o.res = ['→ catalogo-1 (10.0.1.11:8080)'];
            o.rows.r1 = [['10.0.1.11 · .12 · .13', 7, 'dim'], ['1 request', 10, 'acc'], ['GET /produtos/42', 8]]; }
          if (send(o, t, 2.4, 3.1, rev(ROUT(0)), '200 · plush cat page', 'acc', 0.05)) o.on.r1 = 2; send(o, t, 3.15, 3.8, rev(R.in(190)), '200 · plush cat page', 'acc', 0.6);
          if (t > 3.6) T(o, 'r2', 'carrinho and pedidos\nwere never called', 'hi'); } },
      { id: 'tres', dur: 8.5, title: 'Same connection, three services',
        story: 'Lena puts the plush cat in the cart and checks out, all over the same connection. This time the balancer reads each request: GET /carrinho/itens goes to carrinho and POST /pedidos/novo goes to pedidos. What L4 sent to the wrong place, L7 gets right.',
        look: 'Three requests, three rules lit one at a time, three different destinations.',
        key: 'In L7 each request is decided on its own, even inside the same connection.',
        f(o, t) { const Q = [PEDIDO.cat, PEDIDO.carr, PEDIDO.ped], i = clamp(Math.floor((t - 0.3) / 2.6), 0, 2), c = [0, 0, 0];
          const E = env(o, 'dev', { tls: 'gone', http: 'read' }, { http: [Q[i] + ' HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…'] }); E.note = { http: 'L7 reads ✓' }; o.on.dev = 1;
          Q.forEach((p, k) => { const a = 0.3 + k * 2.6; if (send(o, t, a + 0.3, a + 1.2, ROUT(k), p, 'hi', 0.3)) { c[k] = 1; o.on['r' + (k + 1)] = t < a + 2.4 ? 1 : 2;
            o.rows['r' + (k + 1)][1] = ['1 request', 10, 'acc']; o.rows['r' + (k + 1)][2] = [p.split(' ')[1], 8]; } });
          const n = c[0] + c[1] + c[2]; cntMs(o, n, n); o.rows.dev = routeRows(i);
          o.cmd = [Q[i] + ' HTTP/1.1', 'Host: loja.com.br', '(same connection :51514)']; o.res = n ? [`→ ${['catalogo', 'carrinho', 'requests'][n - 1]}`] : [];
          o.scr = { head: 'LB-LOJA · L7 · ROUTES', rows: ['catalogo', 'carrinho', 'requests'].map((s, k) => [s, c[k] ? '1 request' : '0', c[k] ? 'acc' : 'dim']), foot: n === 3 ? 'one connection, three destinations' : '' };
          if (t > 8.0) T(o, 'dev', '3 requests, 3 rules'); } },
      { id: 'custo', dur: 5.5, title: 'The price of reading: +1 ms per request',
        story: 'Reading costs. Decrypting TLS and parsing HTTP uses CPU on the balancer: in the module\'s example, +1 ms per request on L7 against +0.1 ms on L4. For Lena\'s 3 requests, 3 ms against 0.3 ms. On a Black Friday with millions of requests, L7 needs a lot more machines.',
        look: 'The display adds 1 ms for each request on L7; on the line below, what L4 would spend.',
        key: 'L7 knows more and spends more; L4 knows less and spends almost nothing.',
        f(o, t) { const E = env(o, 'dev', { tls: 'gone', http: 'read' }); E.note = { http: 'L7 reads ✓' }; o.on.dev = 1; o.rows.dev = routeRows(-1);
          const n = clamp(Math.floor((t - 0.3) / 0.9) + 1, 0, 3); cntMs(o, n, n);
          [0, 1, 2].forEach(k => { if (k < n) { o.rows['r' + (k + 1)][1] = ['1 request', 10, 'acc']; o.on['r' + (k + 1)] = 2; } });
          o.cmd = ['the 3 requests from Lena: /produtos, /carrinho, /pedidos']; o.res = [`L7: ${n} × 1 ms = ${n} ms`, `L4: ${n} × 0.1 ms = ${fmt(n * 0.1)} ms`];
          o.scr = { head: 'COST AT THE BALANCER', rows: [['L7 · per request', '+1 ms', 'acc'], [`L7 · ${n} requests`, `${n} ms`, 'acc'], ['L4 · per request', '+0.1 ms', 'hi'], [`L4 · ${n} requests`, `${fmt(n * 0.1)} ms`, 'hi']], foot: '10× more work per request' };
          if (t > 3.2) T(o, 'dev', 'L7: 3 ms · L4: 0.3 ms'); } },
      { id: 'regra', dur: 8, title: 'What if it fails: /busca with no rule',
        story: 'Lena searches for "pelucia": GET /busca?q=pelucia&ordem=preco. lb-loja looks for a rule and none matches, because the path does not start with /produtos, /carrinho or /pedidos. It answers 404 itself, and catalogo, which knows how to do the search, never receives the request. With a /busca → catalogo rule, the same request gets there and comes back in 900 ms.',
        look: 'The request hits lb-loja and comes back red; then the /busca rule appears and the light goes to catalogo.',
        key: 'In L7, routing is only as good as the rules: a path with no rule goes nowhere.',
        f(o, t) { const fix = t > 3.6, E = env(o, 'dev', { tls: 'gone', http: fix ? 'read' : t > 1.2 ? 'bad' : 'read' }, { http: ['GET /busca?q=pelucia', '    &ordem=preco HTTP/1.1', 'Host: loja.com.br'] });
          E.note = { http: fix ? 'L7 reads ✓' : t > 1.2 ? 'no rule' : 'L7 reads ✓' }; o.on.dev = t > 1.2 && !fix ? 'bad' : 1; cntMs(o, 0, 0);
          o.cmd = ['GET /busca?q=pelucia&ordem=preco HTTP/1.1', 'Host: loja.com.br'];
          o.rows.dev = fix ? routeRows(3, ['/busca      → catalogo', 8.4, 'acc']) : routeRows(-1, t > 1.2 ? ['/busca: no rule ✕', 8.4, 'bad'] : null);
          o.scr = { head: 'LB-LOJA · L7 · ROUTES', rows: [['/busca?q=pelucia', fix ? 'catalogo' : t > 1.2 ? 'no rule' : '…', fix ? 'acc' : 'bad'], ['catalogo', '0', 'dim']], foot: '' };
          if (send(o, t, 1.4, 2.2, rev(R.in(190)), '404 · no rule', 'bad', 0.8)) { o.res = ['HTTP/1.1 404 Not Found (from lb-loja itself)']; o.scr.foot = 'catalogo never received it'; }
          if (fix) { o.res = ['new rule: /busca → catalogo'];
            if (send(o, t, 3.9, 4.8, ROUT(0), 'GET /busca?q=pelucia', 'hi', 0.1)) { o.on.r1 = 1; cntMs(o, 1, 1); o.scr.rows[1] = ['catalogo', '1 request', 'acc']; o.rows.r1 = [['10.0.1.11 · .12 · .13', 7, 'dim'], ['1 request', 10, 'acc'], ['search · 900 ms', 8]]; }
            if (send(o, t, 5.8, 6.5, rev(ROUT(0)), '200 · 900 ms', 'acc', 0.05)) { o.on.r1 = 2; o.res = ['HTTP/1.1 200 OK · search in 900 ms']; o.scr.foot = 'with the rule: 200 in 900 ms'; }
            send(o, t, 6.55, 7.1, rev(R.in(190)), '200 · results', 'acc', 0.6); }
          if (t > 2.2 && t < 3.6) T(o, 'dev', 'no rule matches\n404 right here', 'bad');
          if (t > 7.2) T(o, 'r1', 'new rule: /busca\nreached catalogo'); } },
    ],
    lab: [
      { id: 'sobe', dur: 5, title: 'docker compose up: 7 containers',
        story: 'In the author\'s public repository, the envoy-patterns folder sets up the same idea in containers. One Envoy plays the load balancer on port 80, in round robin. Behind it, 3 Envoys work as reverse proxies (ports 8081 to 8083), each in front of its own Node.js app (backend-app-1 to 3, port 3000).',
        look: 'The load-balancer in front, the column of 3 proxies and, behind each one, its app.',
        key: 'LB 1:N at the entrance and a 1:1 proxy in front of each app: both patterns together.',
        f(o, t) { o.cmd = ['docker compose up -d']; const order = ['a1', 'a2', 'a3', 'r1', 'r2', 'r3', 'dev'], n = clamp(Math.floor((t - 0.3) / 0.45) + 1, 0, 7);
          order.slice(0, n).forEach((nm, i) => o.on[nm] = i === n - 1 && t < 3.6 ? 1 : 2); o.res = n ? [`${n} of 7 containers up`] : []; labScr(o, [0, 0, 0], 0, n === 7 ? 'ready for curl' : '');
          if (t > 3.6) { T(o, 'ldev', 'LB 1:N · port 80'); T(o, 'a2', 'proxy 1:1\nin front of each app', 'hi'); } } },
      { id: 'rr', dur: 9, title: 'curl 1, 2 and 3: all three on proxy-1',
        story: 'From the terminal, curl -si http://localhost/ three times, right after the up. By the drawing, each would go to a different proxy. Measured in the lab, all three came out through reverse-proxy-1. Each response comes back with the x-proxy-server header, saying which proxy it went through, and with the app\'s JSON carrying the backend\'s name.',
        look: 'The light goes down load-balancer → reverse-proxy-1 → backend-app-1 three times; 2 and 3 stay dark.',
        key: 'Round robin per worker: each Envoy worker rotates on its own.',
        f(o, t) { o.cmd = ['curl -si http://localhost/']; const c = [0, 0, 0]; o.res = [];
          [0, 1, 2].forEach(i => labCurl(o, t, 0.3 + i * 2.8, 0, c, `curl ${i + 1}`));
          labScr(o, c, 0, c[0] === 3 ? '1, 1, 1 · measured in the lab' : '');
          if (t > 8.4) T(o, 'ldev', '3 curls · all on proxy-1'); } },
      { id: 'volta', dur: 9, title: 'curl 4, 5 and 6: all three on proxy-2',
        story: '3 more curls, and all three came out through reverse-proxy-2: 1, 1, 1, 2, 2, 2, not 1, 2, 3, 1, 2, 3. Each Envoy worker rotates on its own and slow_start still weighs on the first 60 s. A minute later, another 6 gave 2, 1, 3, 1, 3, 3; in 12 curls, 3 / 6 / 3. Round robin only evens out in the long run.',
        look: 'Now the light goes down only through reverse-proxy-2; the display stops at 3 / 3 / 0.',
        key: 'Equal weights (load_balancing_weight: 1) split evenly only with many requests.',
        f(o, t) { o.cmd = ['curl -si http://localhost/']; const c = [3, 0, 0]; o.res = []; o.rows.r1[2] = ['3 curls', 8, 'hi'];
          [0, 1, 2].forEach(i => labCurl(o, t, 0.3 + i * 2.8, 1, c, `curl ${i + 4}`));
          labScr(o, c, 0, c[1] === 3 ? '1,1,1,2,2,2 · of 12: 3 / 6 / 3' : '');
          if (t > 8.4) T(o, 'ldev', 'measured in the lab\n12 curls: 3 / 6 / 3'); } },
      { id: 'para', dur: 9, title: 'What if it fails: docker compose stop reverse-proxy-2',
        story: 'Now take one down: docker compose stop reverse-proxy-2. The load-balancer still thinks it is in the pool. A request that lands on it does not come straight back with 503: the stopped container\'s address does not answer, and the request hangs until the client gives up (in the test, curl --max-time 5) or Envoy returns a 503 with the UF flag. Measured in the lab: out of 200 requests, 8 hung and 1 came back 503 (UF).',
        look: 'reverse-proxy-2 turns red; curl 8 reaches it and stays stuck there, with no response.',
        key: 'Between the failure and Envoy removing the host, whoever lands on the stopped one hangs.',
        f(o, t) { o.cmd = t < 0.9 ? ['docker compose stop reverse-proxy-2'] : ['curl -si --max-time 5 http://localhost/']; const c = [3, 3, 0], e = [0];
          if (t > 0.5) { o.rows.r2 = [['Envoy · reverse proxy', 6.8, 'dim'], ['STOPPED', 11, 'bad'], ['3 curls before', 8, 'dim']]; o.on.r2 = 'bad'; }
          [0, 1].forEach(k => o.rows['r' + (k + 1)][2] = ['3 curls', 8, 'hi']); o.res = t < 0.9 ? ['Container reverse-proxy-2  Stopped'] : [];
          [0, 1, 2].forEach(k => labCurl(o, t, 1.0 + k * 2.4, k, c, `curl ${k + 7}`, k === 1 ? e : null));
          labScr(o, c, e[0], e[0] ? '200 requests: 8 hung + 1 503 UF' : ''); o.scr.rows[1][1] = 'stopped'; o.scr.rows[1][2] = 'bad';
          if (t > 7.6) T(o, 'lr2', 'curl 8 · hung\nproxy-2 still in the pool', 'bad'); } },
      { id: 'fora', dur: 10, title: 'Envoy takes proxy-2 out of the pool',
        story: 'load-balancer.yaml checks GET /health every 10 s, with a 1 s timeout, and 3 failures in a row remove the host: by the math, up to 30 s. Measured in the lab, proxy-2 got the pending_dynamic_removal flag at 6 to 12 s (the container\'s name vanished from Docker\'s DNS), failed_active_hc around 27 s, and left /clusters at 34 s; in one run, the last 503 (UF) arrived at 46.9 s. After that, no new curl fails: they go to proxy-1 and proxy-3. With docker compose start, it came back healthy in 4.6 s.',
        look: 'The flags appear on proxy-2, it leaves the pool and the light starts alternating between 1 and 3.',
        key: 'The host leaves the pool in ~27–47 s, not in the 30 s from the math; after that, nothing fails.',
        f(o, t) { const c = [4, 3, 1], e = [1]; o.on.r2 = 'bad'; const nck = clamp(Math.floor((t - 0.3) / 0.9) + 1, 0, 3), out = t > 3.2;
          const FL = ['', 'pending_dynamic_removal', 'failed_active_hc', 'out of /clusters'];
          o.rows.r2 = [['Envoy · reverse proxy', 6.8, 'dim'], [out ? 'OUT OF POOL' : 'STOPPED', 10.5, 'bad'], [FL[nck] || 'stopped', 7.4, 'bad']];
          o.rows.r1[2] = ['4 curls', 8, 'hi']; o.rows.r3[2] = ['1 curl', 8, 'hi']; o.cmd = t < 3.2 ? ['curl -s localhost:9900/clusters | grep health_flags'] : ['curl -si http://localhost/'];
          o.res = t < 3.2 ? [['', '~6–12 s  /pending_dynamic_removal', '~6–12 s  /pending_dynamic_removal\n~27 s    /failed_active_hc', '~6–12 s  /pending_dynamic_removal\n~27 s    /failed_active_hc\n~34 s    out of /clusters'][nck]] : [];
          for (let i = 0; i < Math.min(nck, 3); i++) if (t < 0.3 + i * 0.9 + 0.7) o.beams.push({ pts: LOUT(1), on: true, tone: 'bad', cut: clamp((t - 0.3 - i * 0.9) / 0.6) * 0.8 });
          if (out) { o.rows.dev = [['pool (measured in the lab)', 6.8, 'dim'], ['reverse-proxy-1 ✓', 8.6, 'acc'], ['reverse-proxy-2 out', 8.6, 'bad'], ['reverse-proxy-3 ✓', 8.6, 'acc']]; o.on.dev = 1; }
          [0, 2, 0, 2].forEach((k, i) => labCurl(o, t, 3.6 + i * 1.5, k, c, `curl ${i + 10}`, null, true));
          labScr(o, c, e[0], out ? 'out of the pool in ~27–47 s · 0 new errors' : 'measured in the lab · /clusters'); o.scr.rows[1][1] = out ? 'out of pool' : 'stopped'; o.scr.rows[1][2] = 'bad';
          if (t > 2.4 && t < 4.4) T(o, 'lr2', 'out of the pool\nin ~27–47 s', 'bad');
          if (t > 9.4) T(o, 'ldev', 'curls 10–13: 0 errors\nback to healthy in 4.6 s'); } },
    ],
  };
  // um curl do laboratório: terminal → load-balancer → proxy k → app k e volta (ou fica pendurado se o proxy estiver parado)
  function labCurl(o, t, a, k, c, nm, err, fast) {
    const sp = fast ? 0.55 : 1, dIn = 0.5 * sp, d = 0.45 * sp, pIn = R.in(120), p1 = LOUT(k), p2 = R.app(k);
    if (!send(o, t, a, a + dIn, pIn, nm, 'hi', 0.05)) return; if (t < a + dIn + d * 4 + 0.6) o.on.dev = 1;
    if (err) { if (send(o, t, a + dIn, a + dIn + d, p1, 'GET /', 'bad', 1.6)) { err[0] = 1; o.res = ['(no response: curl gives up after 5 s)'];
        o.rows.dev = [['lb_policy', 6.8, 'dim'], ['ROUND_ROBIN', 10.5, 'acc'], ['turn: proxy-2', 8.4, 'bad'], ['request hung', 8.4, 'bad']]; }
      if (t > a + dIn + d && t < a + dIn + d + 2.4) T(o, 'lr2', `${nm} · hung…`, 'bad'); return; }
    const r = 'r' + (k + 1), ap = 'a' + (k + 1);
    send(o, t, a + dIn, a + dIn + d, p1, 'GET /', 'hi', 0.05); if (t > a + dIn + d) o.on[r] = t < a + dIn + d * 4 ? 1 : 2;
    if (send(o, t, a + dIn + d, a + dIn + 2 * d, p2, '', 'hi', 0.05)) o.on[ap] = t < a + dIn + d * 4 ? 1 : 2;
    send(o, t, a + dIn + 2 * d, a + dIn + 3 * d, rev(p2), '', 'acc', 0.05);
    send(o, t, a + dIn + 3 * d, a + dIn + 4 * d, rev(p1), `x-proxy-server: reverse-proxy-${k + 1}`, 'acc', 0.05);
    if (send(o, t, a + dIn + 4 * d, a + 2 * dIn + 4 * d, rev(pIn), `200 · reverse-proxy-${k + 1}`, 'acc', 0.5)) { c[k]++;
      o.rows[r][2] = [`${c[k]} ${c[k] === 1 ? 'curl' : 'curls'}`, 8, 'acc']; o.rows[ap][2] = [`"service": "backend-app-${k + 1}"`, 7.4, 'acc'];
      o.res = ['HTTP/1.1 200 OK', `x-proxy-server: reverse-proxy-${k + 1}`, `"service": "backend-app-${k + 1}"`]; }
  }
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  const pk = pts => { const a = JSON.stringify(pts), b = JSON.stringify(rev(pts)); return a < b ? a : b; };
  // as vigas do cenário ficam sempre desenhadas (apagadas); a que está em uso no passo substitui a apagada
  function spec() { const o = base(); cur().f(o, lt); const used = new Set(o.beams.map(b => pk(b.pts))); routesOf(o).forEach(pts => { if (!used.has(pk(pts))) o.beams.unshift({ pts }); }); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawBlock(Bk, rows, on, lab) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
      let y = 5; x.textAlign = 'left';   // nenhuma linha abaixo de ~10 unidades: texto fino some no tema claro
      for (const r of rows) { const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.25, lh = s * 1.4; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      if (on === 'bad' && rows === DOWN) { x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(W_ - 36), u(8)); x.lineTo(u(W_ - 10), u(34)); x.moveTo(u(W_ - 10), u(8)); x.lineTo(u(W_ - 36), u(34)); x.stroke(); }
      cv.tex.needsUpdate = true; }
    const fk = JSON.stringify(lab) + (on === 1) + (on === 'bad') + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(), FW = cv.c.width / P; x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; const bs = fitFont(x, u, lab[0], big, FW - 8); x.fillText(lab[0], u(3), u(mid));
      const lw = x.measureText(lab[0]).width / P, room = FW - lw - 12; x.fillStyle = INK();
      if (room > 20) { const ss = fitFont(x, u, lab[1], Math.min(10, bs - 1), room); if (ss >= 6.6) x.fillText(lab[1], u(8 + lw), u(mid)); }
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  const SLABTXT = {
    ip: ['LAYER 3 · IP', ['177.38.20.5 → 203.0.113.10']], tcp: ['LAYER 4 · TCP', ['port 51514 → 443']],
    tls: ['TLS', ['encrypted content', 'opens only with the key']], http: ['LAYER 7 · HTTP', null],
  };
  function drawSlab(S, k, st, note, http) {
    const [title, lines0] = SLABTXT[k], lines = k === 'http' ? http : lines0;
    const key = JSON.stringify([k, st, note, lines]) + theme + accent.getHex(); if (S.key === key) return; S.key = key;
    const cv = S.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    const read = st === 'read', bad = st === 'bad', dim = st === 'skip' || st === 'seal';
    x.fillStyle = bad ? (light ? '#f4e4e2' : '#24130f') : read ? (light ? '#f6ece2' : '#2a1d12') : (light ? '#eeeeed' : '#17181a'); x.fillRect(0, 0, cv.c.width, cv.c.height);
    if (st === 'seal') { x.save(); x.strokeStyle = C.line; x.lineWidth = u(0.6); x.globalAlpha = 0.55; x.beginPath(); for (let i = -H_; i < W_; i += 7) { x.moveTo(u(i), u(H_)); x.lineTo(u(i + H_), 0); } x.stroke(); x.restore(); }
    if (st === 'skip') x.setLineDash([u(2.4), u(1.6)]);
    x.strokeStyle = bad ? BAD() : read ? accC() : C.line; x.lineWidth = u(read || bad ? 1.4 : 0.7); x.strokeRect(u(0.7), u(0.7), cv.c.width - u(1.4), cv.c.height - u(1.4)); x.setLineDash([]);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    const inkT = bad ? BAD() : read ? accC() : INK(), inkF = bad ? BAD() : read ? C.inkHi : dim ? INK() : C.inkHi;
    // fundo sólido atrás do texto (a hachura do TLS não pode atravessar as letras)
    const back = (s, tx, X, Y) => { if (st !== 'seal') return; const w = x.measureText(tx).width; x.fillStyle = light ? '#eeeeed' : '#17181a'; x.fillRect(u(X - 1.5), u(Y - s * 0.62), w + u(3), u(s * 1.24)); };
    let s = fitFont(x, u, title, 8.4, 80); back(s, title, 5, 7.6); x.fillStyle = inkT; x.fillText(title, u(5), u(7.6));
    if (note) { x.textAlign = 'right'; s = fitFont(x, u, note, 8.4, W_ - 92); const nw = x.measureText(note).width / P; back(s, note, W_ - 5 - nw, 7.6);
      x.fillStyle = bad ? BAD() : read ? accC() : INK(); x.fillText(note, u(W_ - 5), u(7.6)); x.textAlign = 'left'; }
    lines.forEach((l, i) => { const sz = i === 0 ? 10.6 : 9; s = fitFont(x, u, l, sz, W_ - 10); const Y = 20 + i * 12.6 + (i ? 1 : 0); back(s, l, 5, Y); x.fillStyle = i === 0 ? inkF : (read ? C.inkHi : INK()); if (dim) x.fillStyle = INK(); x.fillText(l, u(5), u(Y)); });
    cv.tex.needsUpdate = true; S.mat.emissiveIntensity = read ? 0.6 : bad ? 0 : 0;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = o.scr, key = JSON.stringify(s) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), W_ = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = INK(); fitFont(x, u, s.head, 8.6, W_ - 14); x.fillText(s.head, u(7), u(10));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(7), u(18)); x.lineTo(u(W_ - 7), u(18)); x.stroke();
    s.rows.slice(0, 4).forEach(([nm, val, tn], i) => { const Y = 30 + i * 19;
      x.textAlign = 'right'; x.fillStyle = toneC(tn); const vs = fitFont(x, u, val, 12.5, 100); x.fillText(val, u(W_ - 7), u(Y)); const vw = x.measureText(val).width / P;
      x.textAlign = 'left'; x.fillStyle = pal3().inkHi; fitFont(x, u, nm, 10, W_ - vw - 22); x.fillText(nm, u(7), u(Y)); });
    if (s.foot) { x.fillStyle = accC(); fitFont(x, u, s.foot, 9.4, W_ - 14); x.fillText(s.foot, u(7), u(108)); }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">203.0.113.x is a range reserved for documentation and 10.0.x.x is an internal network: the addresses, ports and ms are the module examples.</li>';
  const pre = s => `<pre class="k3-pre">${s.replace(/</g, '&lt;')}</pre>`;
  const DATA = {
    proxy: () => `<li>Reverse proxy <b>1:1</b>: NGINX (203.0.113.20) in front of <b>one</b> server, pagamentos (10.0.2.21:8080)</li>
      <li>At the door: terminates TLS, <b>client_max_body_size 1m</b> (above that, <b>413</b>), forwards with <b>X-Forwarded-For</b>, can keep a cache</li>
      ${pre(`server {
  listen 443 ssl;
  server_name pagamentos.loja.com.br;
  ssl_certificate     /etc/nginx/pagamentos.crt;
  ssl_certificate_key /etc/nginx/pagamentos.key;
  client_max_body_size 1m;
  location / {
    proxy_pass http://10.0.2.21:8080;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}`)}
      <li>Load balancer <b>1:N</b>: lb-loja (203.0.113.10) in front of catalogo-1, 2 and 3 (10.0.1.11 to .13, port 8080)</li>
      <li>pagamentos goes down: <b>502</b> on 100% of requests · catalogo-2 hangs at 20:00:00: checks fail at :05, :10 and :15, out of the pool at <b>20:00:15</b>; in those 15 s, 1 in every 3 requests fails</li>${EX}`,
    l4: () => `<table class="h3-sum"><tr><th>in Lena's request</th><th>L4</th><th>L7</th></tr>
      <tr><td>IP 177.38.20.5 → 203.0.113.10</td><td>sees</td><td>sees</td></tr><tr><td>TCP 51514 → 443</td><td>sees</td><td>sees</td></tr>
      <tr><td>TLS</td><td>passes sealed</td><td>terminates</td></tr><tr class="on"><td>GET /produtos/42 · Host · Cookie</td><td>does not see</td><td>sees</td></tr>
      <tr><td>cost per request</td><td>+0.1 ms</td><td>+1 ms</td></tr></table>
      <li>In L4 the replica terminates TLS: the loja.com.br certificate lives on all 3</li><li>Keep-alive: the following requests go over the same connection and land on the same replica (GET /carrinho/itens → catalogo-1 → <b>404</b>)</li>
      <li>Examples: the AWS NLB works at layer 4; the ALB, at layer 7</li>${EX}`,
    l7: () => `<table class="h3-sum"><tr><th>path</th><th>goes to</th></tr><tr><td>/produtos/*</td><td>catalogo (3 replicas)</td></tr><tr><td>/carrinho/*</td><td>carrinho</td></tr><tr><td>/pedidos/*</td><td>pedidos</td></tr><tr class="on"><td>/busca (was missing)</td><td>catalogo</td></tr></table>
      <li>To read the HTTP, lb-loja <b>terminates TLS</b> with the loja.com.br certificate (module 1, lesson 5)</li>
      <li>Example cost: <b>+1 ms</b> per request on L7, +0.1 ms on L4 · 3 requests: 3 ms against 0.3 ms</li>
      <li>GET /busca?q=pelucia&amp;ordem=preco without a rule: <b>404</b> from the balancer itself; with /busca → catalogo: 200 in <b>900 ms</b></li>${EX}`,
    lab: () => `<li>load-balancer.yaml (real excerpt; the other two endpoints are the same):</li>${pre(`clusters:
- name: reverse_proxy_cluster
  type: STRICT_DNS
  lb_policy: ROUND_ROBIN
  load_assignment:
    endpoints:
    - lb_endpoints:
      - endpoint:
          address:
            socket_address:
              address: reverse-proxy-1
              port_value: 8080
        load_balancing_weight: 1
      # reverse-proxy-2 e reverse-proxy-3 iguais
  health_checks:
  - timeout: 1s
    interval: 10s
    unhealthy_threshold: 3
    healthy_threshold: 2
    http_health_check:
      path: "/health"`)}
      <table class="h3-sum"><tr><th>measured in the lab</th><th>came out</th></tr><tr><td>curls 1 to 6 (right after the up)</td><td>proxy-1, 1, 1, 2, 2, 2</td></tr><tr><td>6 curls a minute later</td><td>2, 1, 3, 1, 3, 3</td></tr><tr><td>12 curls</td><td>3 / 6 / 3</td></tr><tr class="on"><td>proxy-2 stopped, 200 requests</td><td>8 hung + 1 503 (UF) at 46.9 s</td></tr><tr><td>leaving the pool</td><td>pending_dynamic_removal ~6–12 s · failed_active_hc ~27 s · out of /clusters ~34 s</td></tr><tr><td>docker compose start</td><td>healthy in 4.6 s</td></tr></table>
      <li>Ports on your computer: 80 (load-balancer), 8081 to 8083 (proxies), 9900 to 9903 (Envoy admin)</li>
      <li class="h3-dim">With type: STRICT_DNS, Envoy also re-resolves DNS for the names; the stopped container's name disappears from Docker's DNS and the host gets pending_dynamic_removal before the health check. Each Envoy worker rotates on its own. Run with Docker 29.9.1 and envoyproxy/envoy:v1.27-latest, port 8088 instead of 80.</li>`,
  };
  function countHtml() { const o = SP || spec(), [b, l, r] = o.count; return `<b>${b}</b><span>${l}</span><i>${r}</i>`; }
  const boxHtml = o => '<b>Real request</b>' + o.cmd.join('\n').replace(/</g, '&lt;') + (o.res.length ? '<b class="k3-res">Response</b>' + o.res.join('\n').replace(/</g, '&lt;') : '');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="k3count">${countHtml()}</div>
      <div class="i3-sql" id="k3box">${boxHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'camadas') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.count[0]} ${o.count[1]}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'camadas' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-camadas3d-sc', v); } catch (e) {} backLink(); NAMES.forEach(nm => B[nm].pos = null); LAYERS.forEach(k => SLAB[k].pos = null); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'camadas') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec(), L_ = LAY[o.lay];
    NAMES.forEach(nm => { const Bk = B[nm], p = L_[nm], vis = !!p;
      Bk.g.visible = vis; if (!vis) { Bk.pos = null; return; }
      const want = [p[0], p[1], PL];
      if (!Bk.pos) { Bk.pos = want.slice(); Bk.to = want; Bk.from = want; }
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      drawBlock(Bk, o.rows[nm] || [], o.on[nm] || 0, o.lab[nm] || ['', '']); });
    // envelope: cada placa vai para o seu andar; o TLS que sai voa para cima e some; o HTTP desce para o lugar dele
    const E = o.env;
    LAYERS.forEach((k, li) => { const S = SLAB[k];
      const shown = E && E.st[k] !== 'gone' ? (3 - li) < E.show : false, gone = E && E.st[k] === 'gone' && S.pos;
      if (!E || (!shown && !gone)) { S.g.visible = false; S.pos = null; return; }
      const at = ENV[E.at], lvl = k === 'http' && E.st.tls === 'gone' ? 2 : li;
      const want = gone ? [at[0] + 40, at[1] - 70, EZ0 + 2 * EG + 90] : [at[0], at[1], EZ0 + lvl * EG];
      if (!S.pos) { S.pos = [want[0], want[1], want[2] + 34]; S.to = want; S.from = S.pos.slice(); S.t0 = clk; }
      if (want.some((v, i) => v !== S.to[i])) { S.from = S.pos.slice(); S.to = want; S.t0 = clk; }
      const f = ease(clamp((clk - S.t0) / 0.8)); S.pos = lerp3(S.from, S.to, f);
      if (gone && f >= 1) { S.g.visible = false; return; }
      S.g.visible = true; S.g.position.copy(W(...S.pos)); drawSlab(S, k, E.st[k], E.note[k] || '', E.http); });
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    WHO.set(o.who, o.who.startsWith('bot') ? 'bad' : 'dim').at(-56, 300, 6);
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m || !m[2]) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 36); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('k3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const bx = document.getElementById('k3box'), bh = boxHtml(SP); if (bx && bx.innerHTML !== bh) bx.innerHTML = bh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-80, 770, 8, 440];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.92 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.8 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 110) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.46 : nar ? 0.07 + aH * 0.58 : 0.5;
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
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr]), ...LAYERS.map(k => SLAB[k].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; }); LAYERS.forEach(k => SLAB[k].key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(340, 220, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(90, 220, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
