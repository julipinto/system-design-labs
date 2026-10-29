// Figura 3D (iso-glow): o que o balanceador enxerga. O pedido da Lena (Recife) para loja.com.br vira um envelope
// em 4 camadas (IP, TCP, TLS, HTTP), como no módulo 1: o L4 lê só as de fora, o L7 tira o TLS e lê o HTTP.
// Cena: na frente, o aparelho de entrada (NGINX, lb-loja ou o Envoy do laboratório); atrás, a coluna de destinos
// (pagamentos, catalogo-1/2/3, catalogo/carrinho/pedidos ou os 3 proxies e as 3 apps). Ao fundo, à direita, o mostrador
// com o que o balanceador vê e os contadores. Mensagens correm nas vigas com o dado real (POST /pagamentos, 413, GET /produtos/42…).
// Cenários (toggle e ?mode=proxy|l4|l7|lab; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/load-balancers-brief.md) e o envoy-patterns do repositório público do autor.
FIGS3D.push({ id: 'camadas', name: 'Camadas', mod: (() => {
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
  const fmt = v => Number.isInteger(+v.toFixed(2)) ? String(Math.round(v)) : (+v.toFixed(2)).toString().replace('.', ',');

  // ── cenários ──
  const SC = ['proxy', 'l4', 'l7', 'lab'];
  const SCNAME = { proxy: 'Proxy', l4: 'L4', l7: 'L7', lab: 'Lab' };
  const SCFULL = { proxy: 'Proxy 1:1 × LB 1:N', l4: 'Camada 4 (L4)', l7: 'Camada 7 (L7)', lab: 'Laboratório Envoy' };
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
  const DOWN = [['', 6.8], ['FORA DO AR', 12, 'bad'], ['não responde', 8, 'dim']];
  const rep = k => [`catalogo-${k + 1}`, `10.0.1.1${k + 1}:8080`];
  const repRows = (n, ms, extra) => [['réplica do catálogo', 6.8, 'dim'], [`${n} ${n === 1 ? 'pedido' : 'pedidos'}`, 10, n ? 'hi' : 'dim'], extra || [ms != null ? `trabalho: ${ms} ms` : 'pronta', 8, 'dim']];
  const ROUTES = ['/produtos/* → catalogo', '/carrinho/* → carrinho', '/pedidos/*  → pedidos'];
  const routeRows = (lit, extra) => [['regras por caminho', 6.8, 'dim'], ...ROUTES.map((r, i) => [r, 8.4, i === lit ? 'acc' : 'hi']), ...(extra ? [extra] : [])];
  const PEDIDO = { gato: 'GET /produtos/42', busca: 'GET /busca?q=pelucia&ordem=preco', carr: 'GET /carrinho/itens', ped: 'POST /pedidos/novo' };

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const o = { lay: sc === 'proxy' ? 'one' : sc === 'lab' ? 'lab' : 'lb', lab: {}, on: {}, rows: {}, beams: [], tags: [], msgs: [], env: null,
      who: sc === 'lab' ? 'terminal · curl' : 'Lena · Recife', cmd: [], res: [], scr: { head: '', rows: [], foot: '' }, count: ['0', '', ''] };
    if (sc === 'proxy') { o.lab.dev = ['NGINX', '203.0.113.20']; o.lab.pag = ['pagamentos', '10.0.2.21:8080'];
      o.rows.dev = [['proxy reverso 1:1', 6.8, 'dim'], ['termina o TLS', 9.5], ['upload até 1 MB', 9.5], ['esconde 10.0.2.21', 9.5]];
      o.rows.pag = [['servidor único', 6.8, 'dim'], ['só fala com o NGINX', 9], ['rede interna', 9, 'dim']]; }
    if (sc === 'l4' || sc === 'l7' || sc === 'proxy') { o.lab.dev = o.lab.dev || ['lb-loja', '203.0.113.10']; [0, 1, 2].forEach(k => { o.lab['r' + (k + 1)] = rep(k); o.rows['r' + (k + 1)] = repRows(0); }); }
    if (sc === 'l4') o.rows.dev = [['camada 4 (L4)', 6.8, 'dim'], ['lê IP e porta', 10], ['não abre o TLS', 9, 'dim']];
    if (sc === 'l7') { o.lab.r1 = ['catalogo', '3 réplicas']; o.lab.r2 = ['carrinho', 'serviço']; o.lab.r3 = ['pedidos', 'serviço'];
      o.rows.dev = routeRows(-1); o.rows.r1 = [['10.0.1.11 · .12 · .13', 7, 'dim'], ['0 pedidos', 10, 'dim'], ['/produtos/*', 8, 'dim']];
      o.rows.r2 = [['serviço do módulo 6', 6.8, 'dim'], ['0 pedidos', 10, 'dim'], ['/carrinho/*', 8, 'dim']]; o.rows.r3 = [['serviço do módulo 6', 6.8, 'dim'], ['0 pedidos', 10, 'dim'], ['/pedidos/*', 8, 'dim']]; }
    if (sc === 'lab') { o.lab.dev = ['load-balancer', 'Envoy :80'];
      o.rows.dev = [['lb_policy', 6.8, 'dim'], ['ROUND_ROBIN', 10.5, 'acc'], ['health_checks', 7.4, 'dim'], ['/health a cada 10 s', 8.4]];
      [0, 1, 2].forEach(k => { o.lab['r' + (k + 1)] = [`reverse-proxy-${k + 1}`, `:808${k + 1}`]; o.lab['a' + (k + 1)] = [`backend-app-${k + 1}`, ':3000'];
        o.rows['r' + (k + 1)] = [['Envoy · proxy reverso', 6.8, 'dim'], [`→ backend-app-${k + 1}`, 9], ['0 curls', 8, 'dim']];
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
  const env = (o, at, st = {}, extra = {}) => { o.env = { at, st: { ip: '', tcp: '', tls: 'seal', http: 'skip', ...st }, note: {}, http: [PEDIDO.gato + ' HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…'], show: 4, ...extra }; return o.env; };
  const SEES4 = [['IP 177.38.20.5 → .10', 'vê', 'acc'], ['TCP 51514 → 443', 'vê', 'acc'], ['TLS (cifrado)', 'repassa', 'dim'], ['GET /produtos/42', 'não vê', 'bad']];
  const SEES7 = [['IP 177.38.20.5 → .10', 'vê', 'acc'], ['TCP 51514 → 443', 'vê', 'acc'], ['TLS', 'termina aqui', 'acc'], ['GET /produtos/42', 'vê', 'acc']];
  const cntMs = (o, ms, n) => { o.count = [`${fmt(ms)} ms`, 'gastos no balanceador', `· ${n} ${n === 1 ? 'pedido' : 'pedidos'}`]; };
  const cntOk = (o, ok, err) => { o.count = [String(ok), ok === 1 ? 'pedido atendido' : 'pedidos atendidos', `· ${err} com erro`]; };
  const cntLab = (o, c, e) => { const n = c[0] + c[1] + c[2] + e; o.count = [String(n), n === 1 ? 'curl' : 'curls', `· proxy-1 ${c[0]} / proxy-2 ${c[1]} / proxy-3 ${c[2]} / pendurados ${e}`]; };
  const labScr = (o, c, e, foot) => { o.scr = { head: 'LOAD-BALANCER · ROUND_ROBIN', rows: [0, 1, 2].map(k => [`reverse-proxy-${k + 1}`, `${c[k]} ${c[k] === 1 ? 'curl' : 'curls'}`, c[k] ? 'acc' : 'dim'])
    .concat([['pendurados', String(e), e ? 'bad' : 'dim']]), foot: foot || '' }; cntLab(o, c, e); };
  const lbScr = (o, c, foot, bad = -1) => { o.scr = { head: 'LB-LOJA · 203.0.113.10', rows: [0, 1, 2].map(k => [`catalogo-${k + 1}`, k === bad ? c[k] : `${c[k]} ${c[k] === 1 ? 'pedido' : 'pedidos'}`, k === bad ? 'bad' : c[k] ? 'acc' : 'dim']), foot: foot || '' }; };

  const STEPS = {
    proxy: [
      { id: 'tls', dur: 4.5, title: 'A Lena fala com o NGINX, não com o pagamentos',
        story: 'A Lena fecha a compra do gato de pelúcia e o navegador manda o pagamento para pagamentos.loja.com.br. Quem atende é um NGINX no IP 203.0.113.20, na frente de um servidor só, o pagamentos. O NGINX guarda o certificado, termina o TLS e lê o pedido em texto claro.',
        look: 'O pedido sai da Lena cifrado e acende o NGINX; o pagamentos, atrás, continua apagado.',
        key: 'Proxy reverso: um intermediário na frente do servidor, que atende o cliente no lugar dele.',
        f(o, t) { o.cmd = ['POST /pagamentos HTTP/1.1', 'Host: pagamentos.loja.com.br', '(chega cifrado, dentro do TLS)']; cntOk(o, 0, 0);
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['TLS', 'espera…', 'dim'], ['pedidos recebidos', '0', 'dim'], ['repassados', '0', 'dim']], foot: 'pagamentos: 10.0.2.21:8080' };
          if (send(o, t, 0.3, 1.3, R.in(190), 'POST /pagamentos · cifrado', 'hi', 0.3)) { o.on.dev = 1;
            o.rows.dev = [['proxy reverso 1:1', 6.8, 'dim'], ['TLS terminado ✓', 9.5, 'acc'], ['POST /pagamentos', 9.5], ['esconde 10.0.2.21', 9.5]];
            o.scr.rows = [['TLS', 'termina aqui', 'acc'], ['pedidos recebidos', '1', 'acc'], ['repassados', '0', 'dim']]; o.res = ['(o NGINX decifrou e leu o pedido)']; }
          if (t > 1.8) T(o, 'dev', 'certificado de\npagamentos.loja.com.br'); } },
      { id: 'esconde', dur: 5, title: 'Repassa para dentro e esconde o IP',
        story: 'O NGINX abre outra conexão até o pagamentos, no endereço interno 10.0.2.21:8080, e repassa o pedido com o cabeçalho X-Forwarded-For: 177.38.20.5, para o pagamentos saber quem é a cliente. A resposta volta pelo mesmo caminho. A Lena só conhece 203.0.113.20; o 10.0.2.21 nunca sai da rede da loja.',
        look: 'A luz atravessa o NGINX até o pagamentos e volta; o IP interno só aparece do lado de dentro.',
        key: 'O cliente só vê o proxy; o servidor de verdade fica escondido atrás dele.',
        f(o, t) { o.cmd = ['POST /pagamentos HTTP/1.1', 'Host: pagamentos.loja.com.br', 'X-Forwarded-For: 177.38.20.5']; o.on.dev = 1; cntOk(o, 0, 0);
          o.rows.dev = [['proxy reverso 1:1', 6.8, 'dim'], ['TLS terminado ✓', 9.5, 'acc'], ['→ 10.0.2.21:8080', 9.5], ['+ X-Forwarded-For', 9.5]];
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['TLS', 'termina aqui', 'acc'], ['pedidos recebidos', '1', 'acc'], ['repassados', '0', 'dim']], foot: 'a Lena vê: 203.0.113.20' };
          if (send(o, t, 0.3, 1.2, R.pag, 'POST · X-Forwarded-For', 'hi', 0.1)) { o.on.pag = 1; o.scr.rows[2] = ['repassados', '1', 'acc'];
            o.rows.pag = [['de: NGINX (rede interna)', 6.8, 'dim'], ['POST /pagamentos', 9.5, 'acc'], ['cliente: 177.38.20.5', 8.6]]; }
          if (send(o, t, 1.6, 2.4, rev(R.pag), '200 OK', 'acc', 0.05)) o.res = ['HTTP/1.1 200 OK', '(volta pelo NGINX)'];
          if (send(o, t, 2.5, 3.3, rev(R.in(190)), '200 OK · de 203.0.113.20', 'acc', 0.4)) { cntOk(o, 1, 0); o.on.pag = 2; }
          if (t > 3.0) { T(o, 'who', 'a Lena só vê\n203.0.113.20', 'hi'); T(o, 'pag', 'IP 10.0.2.21\nnunca sai da rede'); } } },
      { id: 'limite', dur: 4.5, title: 'Barra um upload de 5 MB na porta',
        story: 'Um robô tenta sobrecarregar o pagamentos com um POST de 5 MB. O NGINX aceita no máximo 1 MB de corpo (client_max_body_size 1m) e responde 413 sem repassar nada. O pagamentos nem fica sabendo: o lixo para na porta.',
        look: 'O pedido grande chega vermelho no NGINX e volta com 413; a viga até o pagamentos fica apagada.',
        key: 'O proxy aplica regras na entrada (tamanho, TLS, cache) antes de o servidor gastar trabalho.',
        f(o, t) { o.who = 'robô · 5 MB'; o.cmd = ['POST /pagamentos HTTP/1.1', 'Content-Length: 5242880  (5 MB)']; cntOk(o, 1, 0);
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['limite de corpo', '1 MB', 'acc'], ['chegou', '5 MB', 'bad'], ['repassados', '0', 'dim']], foot: '' };
          if (send(o, t, 0.3, 1.3, R.in(190), 'POST · 5 MB', 'bad', 0.2)) { o.on.dev = 'bad';
            o.rows.dev = [['proxy reverso 1:1', 6.8, 'dim'], ['5 MB > 1 MB', 10, 'bad'], ['responde 413', 9.5, 'bad'], ['não repassa', 9.5]]; }
          if (send(o, t, 1.6, 2.5, rev(R.in(190)), '413 · grande demais', 'bad', 0.5)) { o.res = ['HTTP/1.1 413 Request Entity Too Large']; cntOk(o, 1, 1); o.scr.foot = 'pagamentos: nada chegou'; }
          if (t > 2.5) T(o, 'pag', 'pagamentos: 0 bytes\nnem ficou sabendo', 'hi'); } },
      { id: 'lb', dur: 7, title: '1:N: o lb-loja na frente de 3 réplicas',
        story: 'O pagamentos tem um servidor só, então o NGINX dele é 1:1. O catálogo roda em 3 réplicas, e o lb-loja, no IP 203.0.113.10, fica na frente delas. Chegam a Lena, a Bia e o Caio, e o lb-loja manda um pedido para cada réplica: 1, 2, 3.',
        look: 'O NGINX dá lugar ao lb-loja; três pedidos saem dele, um para cada réplica do catálogo.',
        key: 'Proxy reverso é um na frente de um (1:1); load balancer, um na frente de vários (1:N). A mesma ferramenta faz os dois papéis.',
        f(o, t) { o.lay = 'lb'; o.lab.dev = ['lb-loja', '203.0.113.10']; o.rows.dev = [['load balancer 1:N', 6.8, 'dim'], ['pool: 3 réplicas', 9.5], ['catalogo-1, 2, 3', 9.5]];
          const who = ['Lena', 'Bia', 'Caio'], what = ['gato', 'busca', 'gato'], c = [0, 0, 0];
          [0, 1, 2].forEach(k => { const a = 0.5 + k * 1.9, s = trip(o, t, a, R.in(190), ROUT(k), `P${k + 1} ${who[k]} · ${what[k]}`, PEDIDO[what[k]].slice(0, 16), '200 OK');
            if (s[1]) { c[k] = 1; o.on['r' + (k + 1)] = t < a + 2.5 ? 1 : 2; o.rows['r' + (k + 1)] = repRows(1, what[k] === 'busca' ? 900 : 20); }
            if (t > a && t < a + 2.5) o.on.dev = 1; });
          const n = c[0] + c[1] + c[2]; cntOk(o, n, 0); lbScr(o, c, n === 3 ? 'um pedido para cada' : '');
          o.cmd = [n ? PEDIDO[what[n - 1]] + ' HTTP/1.1' : PEDIDO.gato + ' HTTP/1.1', 'Host: loja.com.br']; if (n) o.res = [`→ catalogo-${n} (10.0.1.1${n}:8080)`];
          if (t > 6.2) T(o, 'dev', '1 entrada · 3 réplicas'); } },
      { id: 'cai1', dur: 6.5, title: 'E se der errado: o pagamentos cai',
        story: 'De volta ao pagamentos, que caiu às 20:00:00. O NGINX tenta repassar, ninguém atende, e ele devolve 502 Bad Gateway. Não existe outro servidor para tentar: com 1:1, o proxy esconde o servidor, mas não substitui ele. Os pagamentos da Lena, da Bia e do Caio falham, e vão continuar falhando até ele voltar.',
        look: 'O pagamentos fica vermelho; cada pedido chega ao NGINX, bate na viga cortada e volta 502.',
        key: 'Proxy 1:1 protege e organiza a entrada, mas não dá redundância.',
        f(o, t) { o.rows.pag = DOWN; o.on.pag = 'bad'; o.cmd = ['POST /pagamentos HTTP/1.1', 'Host: pagamentos.loja.com.br']; let e = 0;
          const who = ['Lena', 'Bia', 'Caio'];
          [0, 1, 2].forEach(k => { const a = 0.4 + k * 1.9;
            if (send(o, t, a, a + 0.6, R.in(190), `${who[k]} · POST /pagamentos`, 'hi', 0.05)) { if (t < a + 1.3) o.beams.push({ pts: R.pag, on: true, tone: 'bad', cut: 0.5 }); }
            if (send(o, t, a + 0.8, a + 1.4, rev(R.in(190)), '502 Bad Gateway', 'bad', 0.3)) e = k + 1;
            if (t > a && t < a + 1.6) o.on.dev = 1; });
          cntOk(o, 0, e); if (e) o.res = ['HTTP/1.1 502 Bad Gateway'];
          o.scr = { head: 'NGINX · 203.0.113.20', rows: [['pagamentos', 'fora do ar', 'bad'], ['outro servidor', 'não há', 'bad'], ['502 devolvidos', String(e), e ? 'bad' : 'dim']], foot: '20:00:00 · 100% falham' };
          if (t > 5.5) T(o, 'pag', '1:1 · ninguém para\nassumir o lugar', 'bad'); } },
      { id: 'cai2', dur: 9, title: 'Com 1:N, uma réplica cai e a loja segue',
        story: 'Agora o mesmo acidente no catálogo: o catalogo-2 trava às 20:00:00. Enquanto o healthcheck não percebe, 1 de cada 3 pedidos cai nele e falha (502/504). Às 20:00:15, depois de 3 checks falhos, ele sai do pool e 100% dos pedidos vão para o catalogo-1 e o catalogo-3. A loja continua vendendo.',
        look: 'O catalogo-2 fica vermelho; o pedido da Lena falha nele, e depois de 20:00:15 a luz só vai para o 1 e o 3.',
        key: 'Com várias réplicas atrás, o balanceador contorna a que caiu; é isso que o 1:1 não tem.',
        f(o, t) { o.lay = 'lb'; o.lab.dev = ['lb-loja', '203.0.113.10']; o.rows.r2 = DOWN; o.on.r2 = 'bad';
          const Q = [['P4 Davi', 0, 'gato'], ['P5 Lena', 1, 'busca'], ['P6 Bia', 2, 'gato'], ['P7 Caio', 0, 'gato'], ['P8 Davi', 2, 'busca'], ['P9 Lena', 0, 'gato']], c = [0, 0, 0], ms = [0, 0, 0];
          let ok = 0, e = 0, out = t > 4.4;
          o.rows.dev = out ? [['pool', 6.8, 'dim'], ['catalogo-1 ✓', 9.5, 'acc'], ['catalogo-2 fora', 9.5, 'bad'], ['catalogo-3 ✓', 9.5, 'acc']] : [['pool', 6.8, 'dim'], ['catalogo-1 ✓', 9.5], ['catalogo-2 ✓ ?', 9.5], ['catalogo-3 ✓', 9.5]];
          Q.forEach(([nm, k, w], i) => { const a = i < 3 ? 0.3 + i * 1.3 : 4.8 + (i - 3) * 1.3;
            if (send(o, t, a, a + 0.5, R.in(190), `${nm} · ${w}`, 'hi', 0.05)) {
              if (k === 1) { if (t < a + 1.2) o.beams.push({ pts: ROUT(1), on: true, tone: 'bad', cut: 0.6 }); if (send(o, t, a + 0.7, a + 1.2, rev(R.in(190)), '504 · catalogo-2', 'bad', 0.4)) e++; }
              else if (send(o, t, a + 0.55, a + 1.05, ROUT(k), PEDIDO[w].slice(0, 16), 'hi', 0.2)) { c[k]++; ms[k] += w === 'busca' ? 900 : 20; ok++; o.on['r' + (k + 1)] = t < a + 1.4 ? 1 : 2; } }
            if (t > a && t < a + 1.2) o.on.dev = 1; });
          o.rows.r1 = repRows(c[0], ms[0]); o.rows.r3 = repRows(c[2], ms[2]);
          cntOk(o, ok, e); lbScr(o, c, out ? '20:00:15 · catalogo-2 fora do pool' : '20:00:00 · catalogo-2 travou', 1);
          o.scr.rows[1][1] = out ? 'fora do pool' : e ? `${e} erro` : 'travado'; o.cmd = ['GET /health  (a cada 5 s, timeout 1 s)'];
          o.res = t < 4.4 ? ['20:00:05 ✕  20:00:10 ✕  20:00:15 ✕'.slice(0, t < 1.5 ? 11 : t < 3 ? 22 : 34)] : ['3 falhas seguidas → fora do pool'];
          if (t > 3.8 && t < 5.4) T(o, 'r2', '3 checks falharam\n20:00:15 · fora do pool', 'bad');
          if (t > 8.2) T(o, 'dev', 'P4–P9: 5 ok, 1 erro\na loja seguiu'); } },
    ],
    l4: [
      { id: 'camadas', dur: 5, title: 'O pedido da Lena, em 4 camadas',
        story: 'A Lena abre a página do gato: GET /produtos/42 em loja.com.br. Antes de sair do celular, o pedido ganha camadas, como no módulo 1. O HTTP vai dentro do TLS, que cifra tudo; por fora, o TCP põe as portas (51514 → 443) e o IP põe os endereços (177.38.20.5 → 203.0.113.10).',
        look: 'O envelope monta ao lado da Lena, de cima para baixo: HTTP, TLS (riscado, porque é cifrado), TCP e IP.',
        key: 'Quanto mais fundo o balanceador abre o envelope, mais ele sabe e mais ele trabalha.',
        f(o, t) { const n = clamp(Math.floor((t - 0.3) / 0.8) + 1, 0, 4), E = env(o, 'lena', { http: '', tls: 'seal', tcp: '', ip: '' }, { show: n });
          E.note = { http: 'o pedido', tls: 'cifra o de cima', tcp: 'portas', ip: 'endereços' }; [...LAYERS].reverse().forEach((k, i) => { if (i === n - 1 && t < 0.3 + n * 0.8) E.st[k] = 'read'; });
          o.cmd = ['GET /produtos/42 HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…']; o.res = n >= 4 ? ['vai pelo fio como:', 'TCP 177.38.20.5:51514 → 203.0.113.10:443'] : []; cntMs(o, 0, 0);
          o.scr = { head: 'LB-LOJA · 203.0.113.10', rows: [['modo', 'camada 4', 'acc'], ['pedidos', '0', 'dim']], foot: 'esperando o envelope' };
          if (t > 3.8) T(o, 'who', 'monta no celular\nantes de sair', 'hi'); } },
      { id: 'le', dur: 5, title: 'O L4 lê só IP e porta',
        story: 'O envelope chega ao lb-loja, que trabalha na camada 4. Ele lê os dois cabeçalhos de fora: IP 177.38.20.5 → 203.0.113.10 e TCP 51514 → 443. Daí para dentro está cifrado, e o L4 nem tenta abrir: não sabe se é a página do gato, o carrinho ou um pedido.',
        look: 'IP e TCP acendem no envelope; TLS e HTTP ficam apagados, marcados "não abre" e "não vê".',
        key: 'Camada 4 (L4): decide só com IP e porta, sem ler o pedido.',
        f(o, t) { const at = t > 1.3 ? 'dev' : 'lena', E = env(o, at); send(o, t, 0.3, 1.3, R.in(190), 'TCP :51514 → :443', 'hi', 0.3); cntMs(o, 0, 0);
          o.cmd = ['TCP 177.38.20.5:51514 → 203.0.113.10:443', '(o resto vai cifrado)'];
          o.scr = { head: 'LB-LOJA · L4 · O QUE VÊ', rows: SEES4.map(r => t > 1.6 ? r : [r[0], '…', 'dim']), foot: '' };
          if (t > 1.6) { o.on.dev = 1; E.st.ip = E.st.tcp = 'read'; E.note = { ip: 'o L4 lê ✓', tcp: 'o L4 lê ✓', tls: 'não abre', http: 'o L4 não vê' };
            o.rows.dev = [['camada 4 (L4)', 6.8, 'dim'], ['177.38.20.5:51514', 9.5, 'acc'], ['→ :443', 9.5, 'acc'], ['o resto: cifrado', 8.6, 'dim']]; o.res = ['o L4 sabe: de onde vem e para qual porta'];
            o.scr.foot = 'decide só com IP e porta'; }
          if (t > 2.6) T(o, 'dev', 'lê 2 de 4 camadas'); } },
      { id: 'repassa', dur: 5, title: 'Escolhe a réplica e repassa a conexão',
        story: 'Com IP e porta, o lb-loja escolhe uma réplica (aqui, a vez é do catalogo-1, 10.0.1.11:8080) e repassa a conexão inteira, do jeito que veio. Quem termina o TLS é a própria réplica, por isso o certificado de loja.com.br precisa estar nas 3. O trabalho do balanceador foi pouco: +0,1 ms.',
        look: 'A conexão, ainda cifrada, vai do lb-loja ao catalogo-1, que acende e abre o TLS ele mesmo.',
        key: 'O L4 repassa a conexão; quem lê o HTTP é a réplica.',
        f(o, t) { const E = env(o, 'dev', { ip: 'read', tcp: 'read' }); E.note = { ip: 'o L4 lê ✓', tcp: 'o L4 lê ✓', tls: 'vai fechado', http: 'o L4 não vê' }; o.on.dev = 1; cntMs(o, 0, 0);
          o.rows.dev = [['camada 4 (L4)', 6.8, 'dim'], ['vez: catalogo-1', 9.5, 'acc'], ['repassa a conexão', 9], ['+0,1 ms', 9, 'acc']];
          o.cmd = ['TCP 177.38.20.5:51514 → 10.0.1.11:8080', '(mesmos bytes, ainda cifrados)'];
          o.scr = { head: 'LB-LOJA · L4 · O QUE VÊ', rows: SEES4, foot: '' };
          if (send(o, t, 0.4, 1.5, ROUT(0), 'conexão inteira · cifrada', 'hi', 0.3)) { o.on.r1 = 1; cntMs(o, 0.1, 1); o.scr.foot = '+0,1 ms neste pedido';
            o.rows.r1 = [['recebeu a conexão', 6.8, 'dim'], ['termina o TLS', 10, 'acc'], ['lê GET /produtos/42', 8.6]]; o.res = ['catalogo-1 decifra e lê: GET /produtos/42']; }
          if (send(o, t, 2.2, 3.0, rev(ROUT(0)), '200 · página do gato', 'acc', 0.05)) o.on.r1 = 2; send(o, t, 3.05, 3.7, rev(R.in(190)), '200 · página do gato', 'acc', 0.6);
          if (t > 2.2) T(o, 'r1', 'certificado aqui\n(nas 3 réplicas)'); } },
      { id: 'mesma', dur: 6, title: 'E se der errado: o carrinho cai no catálogo',
        story: 'A Lena põe o gato no carrinho. O navegador reaproveita a mesma conexão (keep-alive) e manda GET /carrinho/itens por ela. Para o L4 é a mesma conexão de antes, então vai para o mesmo catalogo-1, que não tem carrinho nenhum: 404. O L4 não consegue mandar /carrinho para o serviço carrinho, porque nunca viu o caminho.',
        look: 'O segundo pedido segue a mesma viga até o catalogo-1 e volta vermelho, com 404.',
        key: 'L4 não roteia por caminho: tudo o que vem numa conexão vai para o mesmo lugar.',
        f(o, t) { const E = env(o, t > 1.0 ? 'dev' : 'lena', { ip: 'read', tcp: 'read' }, { http: [PEDIDO.carr + ' HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…'] });
          E.note = { ip: 'mesma conexão', tcp: 'mesma :51514', tls: 'não abre', http: 'o L4 não vê' }; cntMs(o, 0.1, 1);
          o.cmd = ['mesma conexão 177.38.20.5:51514 (keep-alive)', 'dentro, cifrado: GET /carrinho/itens'];
          o.scr = { head: 'LB-LOJA · L4 · O QUE VÊ', rows: [['IP 177.38.20.5 → .10', 'igual', 'acc'], ['TCP 51514 → 443', 'igual', 'acc'], ['caminho /carrinho', 'não vê', 'bad'], ['destino', 'catalogo-1', 'hi']], foot: '' };
          o.rows.r1 = [['mesma conexão', 6.8, 'dim'], ['GET /produtos/42 ✓', 9], ['', 8]];
          const s = trip(o, t, 0.3, R.in(190), ROUT(0), 'GET /carrinho/itens · cifrado', 'mesma conexão', '404 Not Found', 'bad');
          if (t > 0.3 && t < 2.8) o.on.dev = 1;
          if (s[1]) { cntMs(o, 0.2, 2); o.on.r1 = 'bad'; o.rows.r1 = [['mesma conexão', 6.8, 'dim'], ['GET /produtos/42 ✓', 9], ['/carrinho/itens? 404', 9, 'bad']]; o.res = ['HTTP/1.1 404 Not Found (do catalogo-1)']; o.scr.foot = 'carrinho: nunca recebeu'; }
          if (t > 3.2) T(o, 'r1', 'catálogo não tem carrinho\no L4 não viu o caminho', 'bad'); } },
    ],
    l7: [
      { id: 'abre', dur: 5.5, title: 'O L7 termina o TLS e abre o pedido',
        story: 'Agora o lb-loja trabalha na camada 7. O certificado de loja.com.br fica nele, então ele termina o TLS: decifra o envelope e lê o HTTP inteiro. GET /produtos/42, Host: loja.com.br e o Cookie da sessão da Lena ficam à vista do balanceador.',
        look: 'A camada TLS sai do envelope e o HTTP acende, com o pedido escrito por extenso.',
        key: 'Terminar TLS: o balanceador decifra o pedido para conseguir ler o HTTP.',
        f(o, t) { const at = t > 1.3 ? 'dev' : 'lena', E = env(o, at); send(o, t, 0.3, 1.3, R.in(190), 'TLS · cifrado', 'hi', 0.3); cntMs(o, 0, 0);
          o.cmd = ['TCP 177.38.20.5:51514 → 203.0.113.10:443', '(dentro do TLS: ainda cifrado)'];
          o.scr = { head: 'LB-LOJA · L7 · O QUE VÊ', rows: SEES4.map(r => [r[0], '…', 'dim']), foot: '' };
          if (t > 1.6) { o.on.dev = 1; E.st.ip = E.st.tcp = 'read'; E.st.tls = 'read'; E.note = { ip: 'lê ✓', tcp: 'lê ✓', tls: 'decifrando…', http: '' }; o.scr.rows = SEES7.map((r, i) => i < 2 ? r : [r[0], '…', 'dim']); }
          if (t > 2.6) { E.st.tls = 'gone'; E.st.http = 'read'; E.note = { ip: 'lê ✓', tcp: 'lê ✓', http: 'o L7 lê ✓' }; o.scr.rows = SEES7; o.scr.foot = 'certificado de loja.com.br aqui';
            o.cmd = ['GET /produtos/42 HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…']; o.res = ['TLS terminado no lb-loja']; o.rows.dev = routeRows(-1); }
          if (t > 3.2) T(o, 'dev', 'certificado de\nloja.com.br'); } },
      { id: 'rota', dur: 5, title: 'Lê o caminho e escolhe o serviço',
        story: 'Com o pedido aberto, o lb-loja confere o caminho nas regras: /produtos/* vai para o catalogo, /carrinho/* para o carrinho e /pedidos/* para os pedidos, os serviços do módulo 6. /produtos/42 casa com a primeira regra, e o pedido vai para o pool do catalogo (aqui, o catalogo-1, 10.0.1.11:8080).',
        look: 'A regra /produtos/* acende no lb-loja e a luz vai só até o catalogo.',
        key: 'Camada 7 (L7): decide pelo conteúdo do pedido, como o caminho da URL.',
        f(o, t) { const E = env(o, 'dev', { tls: 'gone', http: 'read' }); E.note = { http: 'o L7 lê ✓' }; o.on.dev = 1; cntMs(o, 0, 0);
          o.cmd = ['GET /produtos/42 HTTP/1.1', 'Host: loja.com.br']; o.rows.dev = routeRows(t > 0.6 ? 0 : -1);
          o.scr = { head: 'LB-LOJA · L7 · ROTAS', rows: [['catalogo', '0', 'dim'], ['carrinho', '0', 'dim'], ['pedidos', '0', 'dim']], foot: t > 0.6 ? '/produtos/42 casa com /produtos/*' : '' };
          if (send(o, t, 1.0, 2.0, ROUT(0), 'GET /produtos/42', 'hi', 0.1)) { o.on.r1 = 1; cntMs(o, 1, 1); o.scr.rows[0] = ['catalogo', '1 pedido', 'acc']; o.res = ['→ catalogo-1 (10.0.1.11:8080)'];
            o.rows.r1 = [['10.0.1.11 · .12 · .13', 7, 'dim'], ['1 pedido', 10, 'acc'], ['GET /produtos/42', 8]]; }
          if (send(o, t, 2.4, 3.1, rev(ROUT(0)), '200 · página do gato', 'acc', 0.05)) o.on.r1 = 2; send(o, t, 3.15, 3.8, rev(R.in(190)), '200 · página do gato', 'acc', 0.6);
          if (t > 3.6) T(o, 'r2', 'carrinho e pedidos\nnem foram chamados', 'hi'); } },
      { id: 'tres', dur: 8.5, title: 'Mesma conexão, três serviços',
        story: 'A Lena põe o gato no carrinho e fecha a compra, tudo pela mesma conexão. Desta vez o balanceador lê cada pedido: GET /carrinho/itens vai para o carrinho e POST /pedidos/novo vai para os pedidos. O que o L4 mandou para o lugar errado, o L7 acerta.',
        look: 'Três pedidos, três regras acesas uma de cada vez, três destinos diferentes.',
        key: 'No L7 cada pedido é decidido sozinho, mesmo dentro da mesma conexão.',
        f(o, t) { const Q = [PEDIDO.gato, PEDIDO.carr, PEDIDO.ped], i = clamp(Math.floor((t - 0.3) / 2.6), 0, 2), c = [0, 0, 0];
          const E = env(o, 'dev', { tls: 'gone', http: 'read' }, { http: [Q[i] + ' HTTP/1.1', 'Host: loja.com.br', 'Cookie: sessao=…'] }); E.note = { http: 'o L7 lê ✓' }; o.on.dev = 1;
          Q.forEach((p, k) => { const a = 0.3 + k * 2.6; if (send(o, t, a + 0.3, a + 1.2, ROUT(k), p, 'hi', 0.3)) { c[k] = 1; o.on['r' + (k + 1)] = t < a + 2.4 ? 1 : 2;
            o.rows['r' + (k + 1)][1] = ['1 pedido', 10, 'acc']; o.rows['r' + (k + 1)][2] = [p.split(' ')[1], 8]; } });
          const n = c[0] + c[1] + c[2]; cntMs(o, n, n); o.rows.dev = routeRows(i);
          o.cmd = [Q[i] + ' HTTP/1.1', 'Host: loja.com.br', '(mesma conexão :51514)']; o.res = n ? [`→ ${['catalogo', 'carrinho', 'pedidos'][n - 1]}`] : [];
          o.scr = { head: 'LB-LOJA · L7 · ROTAS', rows: ['catalogo', 'carrinho', 'pedidos'].map((s, k) => [s, c[k] ? '1 pedido' : '0', c[k] ? 'acc' : 'dim']), foot: n === 3 ? 'uma conexão, três destinos' : '' };
          if (t > 8.0) T(o, 'dev', '3 pedidos, 3 regras'); } },
      { id: 'custo', dur: 5.5, title: 'O preço de ler: +1 ms por pedido',
        story: 'Ler custa. Decifrar o TLS e interpretar o HTTP gasta CPU no balanceador: no exemplo do módulo, +1 ms por pedido no L7 contra +0,1 ms no L4. Nos 3 pedidos da Lena, 3 ms contra 0,3 ms. Numa Black Friday com milhões de pedidos, o L7 precisa de bem mais máquina.',
        look: 'O mostrador soma 1 ms a cada pedido no L7; na linha de baixo, o que o L4 gastaria.',
        key: 'L7 sabe mais e gasta mais; L4 sabe menos e quase não gasta.',
        f(o, t) { const E = env(o, 'dev', { tls: 'gone', http: 'read' }); E.note = { http: 'o L7 lê ✓' }; o.on.dev = 1; o.rows.dev = routeRows(-1);
          const n = clamp(Math.floor((t - 0.3) / 0.9) + 1, 0, 3); cntMs(o, n, n);
          [0, 1, 2].forEach(k => { if (k < n) { o.rows['r' + (k + 1)][1] = ['1 pedido', 10, 'acc']; o.on['r' + (k + 1)] = 2; } });
          o.cmd = ['3 pedidos da Lena: /produtos, /carrinho, /pedidos']; o.res = [`L7: ${n} × 1 ms = ${n} ms`, `L4: ${n} × 0,1 ms = ${fmt(n * 0.1)} ms`];
          o.scr = { head: 'CUSTO NO BALANCEADOR', rows: [['L7 · por pedido', '+1 ms', 'acc'], [`L7 · ${n} pedidos`, `${n} ms`, 'acc'], ['L4 · por pedido', '+0,1 ms', 'hi'], [`L4 · ${n} pedidos`, `${fmt(n * 0.1)} ms`, 'hi']], foot: '10× mais trabalho por pedido' };
          if (t > 3.2) T(o, 'dev', 'L7: 3 ms · L4: 0,3 ms'); } },
      { id: 'regra', dur: 8, title: 'E se der errado: /busca sem regra',
        story: 'A Lena busca "pelucia": GET /busca?q=pelucia&ordem=preco. O lb-loja procura uma regra e nenhuma casa, porque o caminho não começa com /produtos, /carrinho nem /pedidos. Ele mesmo responde 404, e o catalogo, que sabe fazer a busca, nem recebe o pedido. Com a regra /busca → catalogo, o mesmo pedido chega lá e volta em 900 ms.',
        look: 'O pedido bate no lb-loja e volta vermelho; depois aparece a regra /busca e a luz vai até o catalogo.',
        key: 'No L7 o roteamento vale o que valem as regras: caminho sem regra não chega a lugar nenhum.',
        f(o, t) { const fix = t > 3.6, E = env(o, 'dev', { tls: 'gone', http: fix ? 'read' : t > 1.2 ? 'bad' : 'read' }, { http: ['GET /busca?q=pelucia', '    &ordem=preco HTTP/1.1', 'Host: loja.com.br'] });
          E.note = { http: fix ? 'o L7 lê ✓' : t > 1.2 ? 'nenhuma regra' : 'o L7 lê ✓' }; o.on.dev = t > 1.2 && !fix ? 'bad' : 1; cntMs(o, 0, 0);
          o.cmd = ['GET /busca?q=pelucia&ordem=preco HTTP/1.1', 'Host: loja.com.br'];
          o.rows.dev = fix ? routeRows(3, ['/busca      → catalogo', 8.4, 'acc']) : routeRows(-1, t > 1.2 ? ['/busca: sem regra ✕', 8.4, 'bad'] : null);
          o.scr = { head: 'LB-LOJA · L7 · ROTAS', rows: [['/busca?q=pelucia', fix ? 'catalogo' : t > 1.2 ? 'sem regra' : '…', fix ? 'acc' : 'bad'], ['catalogo', '0', 'dim']], foot: '' };
          if (send(o, t, 1.4, 2.2, rev(R.in(190)), '404 · sem regra', 'bad', 0.8)) { o.res = ['HTTP/1.1 404 Not Found (do próprio lb-loja)']; o.scr.foot = 'o catalogo nem recebeu'; }
          if (fix) { o.res = ['regra nova: /busca → catalogo'];
            if (send(o, t, 3.9, 4.8, ROUT(0), 'GET /busca?q=pelucia', 'hi', 0.1)) { o.on.r1 = 1; cntMs(o, 1, 1); o.scr.rows[1] = ['catalogo', '1 pedido', 'acc']; o.rows.r1 = [['10.0.1.11 · .12 · .13', 7, 'dim'], ['1 pedido', 10, 'acc'], ['busca · 900 ms', 8]]; }
            if (send(o, t, 5.8, 6.5, rev(ROUT(0)), '200 · 900 ms', 'acc', 0.05)) { o.on.r1 = 2; o.res = ['HTTP/1.1 200 OK · busca em 900 ms']; o.scr.foot = 'com a regra: 200 em 900 ms'; }
            send(o, t, 6.55, 7.1, rev(R.in(190)), '200 · resultados', 'acc', 0.6); }
          if (t > 2.2 && t < 3.6) T(o, 'dev', 'nenhuma regra casa\n404 aqui mesmo', 'bad');
          if (t > 7.2) T(o, 'r1', 'regra nova: /busca\nchegou ao catalogo'); } },
    ],
    lab: [
      { id: 'sobe', dur: 5, title: 'docker compose up: 7 containers',
        story: 'No repositório público do autor, a pasta envoy-patterns monta a mesma ideia em containers. Um Envoy faz o papel de load balancer na porta 80, em round robin. Atrás dele, 3 Envoys trabalham como proxy reverso (portas 8081 a 8083), cada um na frente da sua aplicação Node.js (backend-app-1 a 3, porta 3000).',
        look: 'O load-balancer na frente, a coluna dos 3 proxies e, atrás de cada um, a sua aplicação.',
        key: 'LB 1:N na entrada e um proxy 1:1 na frente de cada app: os dois padrões juntos.',
        f(o, t) { o.cmd = ['docker compose up -d']; const order = ['a1', 'a2', 'a3', 'r1', 'r2', 'r3', 'dev'], n = clamp(Math.floor((t - 0.3) / 0.45) + 1, 0, 7);
          order.slice(0, n).forEach((nm, i) => o.on[nm] = i === n - 1 && t < 3.6 ? 1 : 2); o.res = n ? [`${n} de 7 containers no ar`] : []; labScr(o, [0, 0, 0], 0, n === 7 ? 'pronto para o curl' : '');
          if (t > 3.6) { T(o, 'ldev', 'LB 1:N · porta 80'); T(o, 'a2', 'proxy 1:1\nna frente de cada app', 'hi'); } } },
      { id: 'rr', dur: 9, title: 'curl 1, 2 e 3: os três no proxy-1',
        story: 'Do terminal, curl -si http://localhost/ três vezes, logo depois do up. Pelo desenho, cada um iria para um proxy. Medido no lab, os três saíram pelo reverse-proxy-1. Cada resposta volta com o cabeçalho x-proxy-server, dizendo por qual proxy passou, e com o JSON da aplicação trazendo o nome do backend.',
        look: 'A luz desce load-balancer → reverse-proxy-1 → backend-app-1 três vezes; o 2 e o 3 ficam apagados.',
        key: 'Round robin por worker: cada worker do Envoy gira a sua própria vez.',
        f(o, t) { o.cmd = ['curl -si http://localhost/']; const c = [0, 0, 0]; o.res = [];
          [0, 1, 2].forEach(i => labCurl(o, t, 0.3 + i * 2.8, 0, c, `curl ${i + 1}`));
          labScr(o, c, 0, c[0] === 3 ? '1, 1, 1 · medido no lab' : '');
          if (t > 8.4) T(o, 'ldev', '3 curls · todos no proxy-1'); } },
      { id: 'volta', dur: 9, title: 'curl 4, 5 e 6: os três no proxy-2',
        story: 'Mais 3 curls, e os três saíram pelo reverse-proxy-2: 1, 1, 1, 2, 2, 2, não 1, 2, 3, 1, 2, 3. Cada worker do Envoy gira a sua própria vez e o slow_start ainda pesa nos primeiros 60 s. Um minuto depois, outros 6 deram 2, 1, 3, 1, 3, 3; em 12 curls, 3 / 6 / 3. O round robin só se equilibra no longo prazo.',
        look: 'Agora a luz desce só pelo reverse-proxy-2; o mostrador para em 3 / 3 / 0.',
        key: 'Pesos iguais (load_balancing_weight: 1) dividem por igual só com muitos pedidos.',
        f(o, t) { o.cmd = ['curl -si http://localhost/']; const c = [3, 0, 0]; o.res = []; o.rows.r1[2] = ['3 curls', 8, 'hi'];
          [0, 1, 2].forEach(i => labCurl(o, t, 0.3 + i * 2.8, 1, c, `curl ${i + 4}`));
          labScr(o, c, 0, c[1] === 3 ? '1,1,1,2,2,2 · em 12: 3 / 6 / 3' : '');
          if (t > 8.4) T(o, 'ldev', 'medido no lab\n12 curls: 3 / 6 / 3'); } },
      { id: 'para', dur: 9, title: 'E se der errado: docker compose stop reverse-proxy-2',
        story: 'Agora derrube um: docker compose stop reverse-proxy-2. O load-balancer ainda acha que ele está no pool. O pedido que cai nele não volta logo com 503: o endereço do container parado não responde, e o pedido fica pendurado até o cliente desistir (no teste, curl --max-time 5) ou o Envoy devolver um 503 com a marca UF. Medido no lab: em 200 pedidos, 8 ficaram pendurados e 1 voltou 503 (UF).',
        look: 'O reverse-proxy-2 fica vermelho; o curl 8 chega nele e fica parado ali, sem resposta.',
        key: 'Entre a queda e o Envoy tirar o host, quem cai no parado fica pendurado.',
        f(o, t) { o.cmd = t < 0.9 ? ['docker compose stop reverse-proxy-2'] : ['curl -si --max-time 5 http://localhost/']; const c = [3, 3, 0], e = [0];
          if (t > 0.5) { o.rows.r2 = [['Envoy · proxy reverso', 6.8, 'dim'], ['PARADO', 11, 'bad'], ['3 curls antes', 8, 'dim']]; o.on.r2 = 'bad'; }
          [0, 1].forEach(k => o.rows['r' + (k + 1)][2] = ['3 curls', 8, 'hi']); o.res = t < 0.9 ? ['Container reverse-proxy-2  Stopped'] : [];
          [0, 1, 2].forEach(k => labCurl(o, t, 1.0 + k * 2.4, k, c, `curl ${k + 7}`, k === 1 ? e : null));
          labScr(o, c, e[0], e[0] ? '200 pedidos: 8 pendurados + 1 503 UF' : ''); o.scr.rows[1][1] = 'parado'; o.scr.rows[1][2] = 'bad';
          if (t > 7.6) T(o, 'lr2', 'curl 8 · pendurado\nproxy-2 ainda no pool', 'bad'); } },
      { id: 'fora', dur: 10, title: 'O Envoy tira o proxy-2 do pool',
        story: 'O load-balancer.yaml verifica GET /health a cada 10 s, com timeout de 1 s, e 3 falhas seguidas tiram o host: na conta, até 30 s. Medido no lab, o proxy-2 ganhou a marca pending_dynamic_removal em 6 a 12 s (o nome do container sumiu do DNS do Docker), failed_active_hc perto de 27 s, e saiu de /clusters aos 34 s; numa execução, o último 503 (UF) chegou em 46,9 s. Depois disso, nenhum curl novo falha: vão para o proxy-1 e o proxy-3. Com docker compose start, ele voltou healthy em 4,6 s.',
        look: 'As marcas aparecem no proxy-2, ele sai do pool e a luz passa a alternar entre o 1 e o 3.',
        key: 'O host sai do pool em ~27–47 s, não nos 30 s da conta; depois, nenhum falha.',
        f(o, t) { const c = [4, 3, 1], e = [1]; o.on.r2 = 'bad'; const nck = clamp(Math.floor((t - 0.3) / 0.9) + 1, 0, 3), out = t > 3.2;
          const FL = ['', 'pending_dynamic_removal', 'failed_active_hc', 'fora de /clusters'];
          o.rows.r2 = [['Envoy · proxy reverso', 6.8, 'dim'], [out ? 'FORA DO POOL' : 'PARADO', 10.5, 'bad'], [FL[nck] || 'parado', 7.4, 'bad']];
          o.rows.r1[2] = ['4 curls', 8, 'hi']; o.rows.r3[2] = ['1 curl', 8, 'hi']; o.cmd = t < 3.2 ? ['curl -s localhost:9900/clusters | grep health_flags'] : ['curl -si http://localhost/'];
          o.res = t < 3.2 ? [['', '~6–12 s  /pending_dynamic_removal', '~6–12 s  /pending_dynamic_removal\n~27 s    /failed_active_hc', '~6–12 s  /pending_dynamic_removal\n~27 s    /failed_active_hc\n~34 s    fora de /clusters'][nck]] : [];
          for (let i = 0; i < Math.min(nck, 3); i++) if (t < 0.3 + i * 0.9 + 0.7) o.beams.push({ pts: LOUT(1), on: true, tone: 'bad', cut: clamp((t - 0.3 - i * 0.9) / 0.6) * 0.8 });
          if (out) { o.rows.dev = [['pool (medido no lab)', 6.8, 'dim'], ['reverse-proxy-1 ✓', 8.6, 'acc'], ['reverse-proxy-2 fora', 8.6, 'bad'], ['reverse-proxy-3 ✓', 8.6, 'acc']]; o.on.dev = 1; }
          [0, 2, 0, 2].forEach((k, i) => labCurl(o, t, 3.6 + i * 1.5, k, c, `curl ${i + 10}`, null, true));
          labScr(o, c, e[0], out ? 'fora do pool em ~27–47 s · 0 erros novos' : 'medido no lab · /clusters'); o.scr.rows[1][1] = out ? 'fora do pool' : 'parado'; o.scr.rows[1][2] = 'bad';
          if (t > 2.4 && t < 4.4) T(o, 'lr2', 'fora do pool\nem ~27–47 s', 'bad');
          if (t > 9.4) T(o, 'ldev', 'curls 10–13: 0 erros\nvolta healthy em 4,6 s'); } },
    ],
  };
  // um curl do laboratório: terminal → load-balancer → proxy k → app k e volta (ou fica pendurado se o proxy estiver parado)
  function labCurl(o, t, a, k, c, nm, err, fast) {
    const sp = fast ? 0.55 : 1, dIn = 0.5 * sp, d = 0.45 * sp, pIn = R.in(120), p1 = LOUT(k), p2 = R.app(k);
    if (!send(o, t, a, a + dIn, pIn, nm, 'hi', 0.05)) return; if (t < a + dIn + d * 4 + 0.6) o.on.dev = 1;
    if (err) { if (send(o, t, a + dIn, a + dIn + d, p1, 'GET /', 'bad', 1.6)) { err[0] = 1; o.res = ['(sem resposta: o curl desiste em 5 s)'];
        o.rows.dev = [['lb_policy', 6.8, 'dim'], ['ROUND_ROBIN', 10.5, 'acc'], ['vez do proxy-2', 8.4, 'bad'], ['pedido pendurado', 8.4, 'bad']]; }
      if (t > a + dIn + d && t < a + dIn + d + 2.4) T(o, 'lr2', `${nm} · pendurado…`, 'bad'); return; }
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
    ip: ['CAMADA 3 · IP', ['177.38.20.5 → 203.0.113.10']], tcp: ['CAMADA 4 · TCP', ['porta 51514 → 443']],
    tls: ['TLS', ['conteúdo cifrado', 'só abre com a chave']], http: ['CAMADA 7 · HTTP', null],
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
  const EX = '<li class="h3-dim">203.0.113.x é uma faixa reservada para documentação e 10.0.x.x é rede interna: os endereços, as portas e os ms são os exemplos do módulo.</li>';
  const pre = s => `<pre class="k3-pre">${s.replace(/</g, '&lt;')}</pre>`;
  const DATA = {
    proxy: () => `<li>Proxy reverso <b>1:1</b>: o NGINX (203.0.113.20) na frente de <b>um</b> servidor, o pagamentos (10.0.2.21:8080)</li>
      <li>Na porta: termina o TLS, <b>client_max_body_size 1m</b> (acima disso, <b>413</b>), repassa com <b>X-Forwarded-For</b>, pode guardar cache</li>
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
      <li>Load balancer <b>1:N</b>: o lb-loja (203.0.113.10) na frente de catalogo-1, 2 e 3 (10.0.1.11 a .13, porta 8080)</li>
      <li>pagamentos cai: <b>502</b> em 100% dos pedidos · catalogo-2 trava às 20:00:00: checks falham às :05, :10 e :15, fora do pool às <b>20:00:15</b>; nesses 15 s, 1 de cada 3 pedidos falha</li>${EX}`,
    l4: () => `<table class="h3-sum"><tr><th>no pedido da Lena</th><th>L4</th><th>L7</th></tr>
      <tr><td>IP 177.38.20.5 → 203.0.113.10</td><td>vê</td><td>vê</td></tr><tr><td>TCP 51514 → 443</td><td>vê</td><td>vê</td></tr>
      <tr><td>TLS</td><td>repassa fechado</td><td>termina</td></tr><tr class="on"><td>GET /produtos/42 · Host · Cookie</td><td>não vê</td><td>vê</td></tr>
      <tr><td>custo por pedido</td><td>+0,1 ms</td><td>+1 ms</td></tr></table>
      <li>No L4 quem termina o TLS é a réplica: o certificado de loja.com.br fica nas 3</li><li>Keep-alive: os pedidos seguintes vão pela mesma conexão e caem na mesma réplica (GET /carrinho/itens → catalogo-1 → <b>404</b>)</li>
      <li>Exemplos: o NLB da AWS trabalha na camada 4; o ALB, na camada 7</li>${EX}`,
    l7: () => `<table class="h3-sum"><tr><th>caminho</th><th>vai para</th></tr><tr><td>/produtos/*</td><td>catalogo (3 réplicas)</td></tr><tr><td>/carrinho/*</td><td>carrinho</td></tr><tr><td>/pedidos/*</td><td>pedidos</td></tr><tr class="on"><td>/busca (faltava)</td><td>catalogo</td></tr></table>
      <li>Para ler o HTTP, o lb-loja <b>termina o TLS</b> com o certificado de loja.com.br (módulo 1, aula 5)</li>
      <li>Custo do exemplo: <b>+1 ms</b> por pedido no L7, +0,1 ms no L4 · 3 pedidos: 3 ms contra 0,3 ms</li>
      <li>GET /busca?q=pelucia&amp;ordem=preco sem regra: <b>404</b> do próprio balanceador; com /busca → catalogo: 200 em <b>900 ms</b></li>${EX}`,
    lab: () => `<li>load-balancer.yaml (trecho real; os outros dois endpoints são iguais):</li>${pre(`clusters:
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
      <table class="h3-sum"><tr><th>medido no lab</th><th>saiu</th></tr><tr><td>curls 1 a 6 (logo após o up)</td><td>proxy-1, 1, 1, 2, 2, 2</td></tr><tr><td>6 curls um minuto depois</td><td>2, 1, 3, 1, 3, 3</td></tr><tr><td>12 curls</td><td>3 / 6 / 3</td></tr><tr class="on"><td>proxy-2 parado, 200 pedidos</td><td>8 pendurados + 1 503 (UF) em 46,9 s</td></tr><tr><td>saída do pool</td><td>pending_dynamic_removal ~6–12 s · failed_active_hc ~27 s · fora de /clusters ~34 s</td></tr><tr><td>docker compose start</td><td>healthy em 4,6 s</td></tr></table>
      <li>Portas no seu computador: 80 (load-balancer), 8081 a 8083 (proxies), 9900 a 9903 (admin do Envoy)</li>
      <li class="h3-dim">Com type: STRICT_DNS o Envoy também refaz o DNS dos nomes; o nome do container parado some do DNS do Docker e o host ganha pending_dynamic_removal antes do health check. Cada worker do Envoy gira a sua própria vez. Rodado com Docker 29.9.1 e envoyproxy/envoy:v1.27-latest, porta 8088 no lugar da 80.</li>`,
  };
  function countHtml() { const o = SP || spec(), [b, l, r] = o.count; return `<b>${b}</b><span>${l}</span><i>${r}</i>`; }
  const boxHtml = o => '<b>Pedido real</b>' + o.cmd.join('\n').replace(/</g, '&lt;') + (o.res.length ? '<b class="k3-res">Resposta</b>' + o.res.join('\n').replace(/</g, '&lt;') : '');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="k3count">${countHtml()}</div>
      <div class="i3-sql" id="k3box">${boxHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'camadas') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.count[0]} ${o.count[1]}`; }
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
    WHO.set(o.who, o.who.startsWith('robô') ? 'bad' : 'dim').at(-56, 300, 6);
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(340, 220, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(90, 220, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–4 · arraste para girar' };
})() });
