// Figura 3D (iso-glow): service mesh. Os pods da loja (namespace loja) e a malha entre eles; a chamada-estrela é o pedidos
// cobrando o pedido 1048 (94.90) no pagamentos: POST http://pagamentos:8080/cobrancas.
// Cena: ao fundo, o istiod (control plane) com as regras que guarda e o mostrador (contadores, a regra ativa em YAML e a resposta).
// Na frente, 3 nós (colunas) com 2 pods cada: catalogo, estoque, recomendacoes atrás; bff-app, pedidos, pagamentos na frente.
// Cada pod tem o app e, conforme o cenário, o Envoy colado do lado do corredor; no ambient o Envoy some e entra 1 ztunnel por nó
// no corredor e 1 waypoint na ponta. Cabos finos no alto ligam o istiod aos proxies (xDS). Cada proxy acende quando a luz passa.
// Cenários (toggle e ?mode=sem|sidecar|regras|falha|ambient; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/service-mesh-brief.md).
FIGS3D.push({ id: 'mesh', name: 'Service mesh', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const dec = v => String(+v.toFixed(2));

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['sem', 'sidecar', 'regras', 'falha', 'ambient'];
  const SCNAME = { sem: 'No mesh', sidecar: 'Sidecar', regras: 'Rules', falha: 'Failure', ambient: 'Ambient' };
  const SCFULL = { sem: 'No mesh: each app does it its own way', sidecar: 'Sidecar: an Envoy in every pod', regras: 'Rules: the control plane pushes',
    falha: 'Fault injection and retry storm', ambient: 'Ambient: ztunnel per node and waypoint' };
  const AULA = { sem: 'aula-1-introducao', sidecar: 'aula-4-modelos-sdk-sidecar-e-proxyless', regras: 'aula-3-control-plane-e-data-plane',
    falha: 'aula-2-features-agregadas', ambient: 'aula-5-modelos-ebpf-e-ztunnel' };
  const SID = n => `spiffe://loja.local/ns/loja/sa/${n}`;
  const BODY = '{"pedido_id":1048,"valor":94.90}';
  let clk = 0, sc = 'sem', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-mesh3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  // 3 nós em colunas; pods de trás (r 0) e da frente (r 1) olham para o corredor do meio, onde corre o tráfego da malha
  const PL = 7, Z = 10, COLX = [24, 250, 476], PW = 200, CX = c => COLX[c] + PW / 2;
  const LY = 255, AH = 26, SH = 22;
  const APPY = [112, 334], AD = 64, SIDEY = [180, 304], SD = 26, EDGE = [176, 334];
  const PODS = {
    cat: { nm: 'catalogo', lang: 'Node.js', c: 0, r: 0 }, est: { nm: 'estoque', lang: 'Java', c: 1, r: 0 }, rec: { nm: 'recomendacoes', lang: 'Go', c: 2, r: 0 },
    bff: { nm: 'bff-app', lang: 'Node.js', c: 0, r: 1 }, ped: { nm: 'pedidos', lang: 'Go', c: 1, r: 1 }, pag: { nm: 'pagamentos', lang: 'Java', c: 2, r: 1 },
  };
  const PK = Object.keys(PODS);
  const ZTY = 236, ZTD = 38, ZTW = 120, ZTH = 14, WPX = 690, WPY = 222, WPW = 112, WPD = 66, WPH = 22;
  const ISX = 20, ISY = 16, ISW = 222, ISD = 80, ISH = 40;
  plateWith(g0, 815, 422, [[14, 14], [801, 14], [14, 408], [801, 408]]);
  hazeAndShadow(g0, 407, 211, 9.6, 5.4);
  // mostrador ao fundo
  rbox(262, 12, PL, 540, 12, 150, 5, bodyMat, g0);
  const scr = faceCanvas('front', 266, 24, 154, 532, 143, 4, g0);
  // blocos fixos no lugar; os que entram e saem (Envoy, ztunnel, waypoint) afundam na base
  function block(x, y, w, d, h, kind, extra) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 5, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    return { g, mat, top, glow, x, y, w, d, h, kind, key: '', f: 1, ...extra };
  }
  const B = {};
  PK.forEach(k => { const p = PODS[k]; B[k] = block(COLX[p.c], APPY[p.r], PW, AD, AH, 'app', { pod: k });
    B['s' + k] = block(COLX[p.c], SIDEY[p.r], PW, SD, SH, 'side', { pod: k }); });
  [0, 1, 2].forEach(c => { B['z' + c] = block(CX(c) - ZTW / 2, ZTY, ZTW, ZTD, ZTH, 'zt', { c }); });
  B.wp = block(WPX, WPY, WPW, WPD, WPH, 'wp');
  B.ist = block(ISX, ISY, ISW, ISD, ISH, 'ist');
  const NAMES = Object.keys(B), PROXY = n => B[n].kind !== 'app' && B[n].kind !== 'ist';
  // rótulos dos nós no chão, na frente de cada coluna
  const NODE = [0, 1, 2].map(c => faceCanvas('top', COLX[c] + 4, 402, PL, PW - 8, 15, 5, g0));
  creases(first);

  // conexões grossas (vigas), cabos de configuração finos e pontos de luz que correm neles
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 90 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 12 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.thin ? (b.on ? 2.6 : 1.8) : b.on ? 6 : 4) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); D.g.scale.setScalar(b.thin ? 0.6 : 1); moveGlow(D.glow, p, 0.9); }
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
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(11), tag(11)], LENA = tag(11);

  // ── rotas (no chão, z = 10): do app sai pela borda do corredor, passa pelo Envoy (ou ztunnel) e corre no corredor ──
  const pod = k => PODS[k];
  const edge = (k, dx = 0) => [CX(pod(k).c) + dx, EDGE[pod(k).r], Z];
  function route(a, b, dxa = 0, dxb = 0) {
    const A = edge(a, dxa), Bp = edge(b, dxb);
    return [A, [A[0], LY, Z], [Bp[0], LY, Z], Bp];
  }
  // pelo waypoint: sai do ztunnel de origem por trás, vai à ponta, volta e entra no ztunnel de destino pela lateral
  function routeWp(a, b, dxa = 0, dxb = 0) {
    const A = edge(a, dxa), Bp = edge(b, dxb), ca = CX(pod(a).c), cb = CX(pod(b).c);
    return [A, [A[0], LY, Z], [ca, LY, Z], [ca, 228, Z], [WPX + 20, 228, Z], [WPX + 20, 248, Z], [cb + ZTW / 2 + 4, 248, Z], [Bp[0], 248, Z], Bp];
  }
  const LENA_R = [[-70, 368, Z], [COLX[0], 368, Z]];
  const rev = pts => pts.slice().reverse();
  // cabos de configuração: do istiod sobem, correm no alto e descem até o topo de cada proxy
  const CZ = 72;
  const cable = n => { const b = B[n], tx = b.x + b.w * (b.kind === 'side' ? 0.82 : 0.5), ty = b.y + b.d / 2;
    return [[ISX + ISW * 0.6, ISY + ISD - 6, PL + ISH], [ISX + ISW * 0.6, 104, CZ], [tx, 104, CZ], [tx, ty, CZ], [tx, ty, PL + b.h]]; };
  // balões: na faixa livre ao lado de cada peça (nunca em cima do texto dela)
  const ABOVE = k => { if (B[k]) { const b = B[k]; if (b.kind === 'app' || b.kind === 'side') { const p = pod(b.pod); return p.r ? [CX(p.c), 414, 10] : [CX(p.c), 262, 8]; }
      if (b.kind === 'zt') return [CX(b.c), 290, 8]; if (b.kind === 'wp') return [WPX + WPW / 2, 316, 10]; if (b.kind === 'ist') return [ISX + ISW / 2, 104, 54]; } return k; };
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : ABOVE(at)), text, tone]);

  // ── conteúdo dos blocos ──
  const OWN = {
    cat: [['metrics: none', 'bad'], ['retry: 3× (Node.js lib)']], est: [['TLS: none', 'bad'], ['retry: none']],
    rec: [['customers who bought', 'dim'], ['also bought (module 9)', 'dim']], bff: [['timeout 100 ms', 'dim'], ['fallback (module 9)', 'dim']],
    ped: [['retry: 5×, no wait', 'bad'], ['TLS: Go lib']], pag: [['TLS: Java lib'], ['metrics: own', 'dim']],
  };
  const MESHED = [['code: business only', 'dim'], ['network: outside the app', 'dim']];
  const appRows = (k, ...l) => ({ name: pod(k).nm, lang: pod(k).lang, rows: l.length ? l : sc === 'sem' ? OWN[k] : MESHED });
  const sideRows = (st, tone = 'dim') => ({ name: 'ENVOY', lang: 'sidecar', rows: [[st, tone]] });
  const ztRows = (c, st = 'L4 · mTLS', tone = 'dim') => ({ name: 'ZTUNNEL', lang: 'node ' + (c + 1), rows: [[st, tone]] });
  const wpRows = (st = 'L7 · ns loja', tone = 'dim', st2 = 'retry · route · RBAC') => ({ name: 'WAYPOINT', lang: '', rows: [[st, tone], [st2, 'dim']] });
  const istRows = (...extra) => ({ name: 'ISTIOD', lang: 'control plane', rows: extra.length ? extra : [['VirtualService · DestinationRule', 'dim'], ['AuthorizationPolicy', 'dim'], ['PeerAuthentication', 'dim'], ['certificates · 24 h', 'dim']] });

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const mesh = sc !== 'sem';
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], msgs: [], dots: [], cnt: [], res: [], cab: mesh ? 'idle' : null, cabT: [], lena: false };
    PK.forEach(k => { o.show[k] = 1; o.rows[k] = appRows(k); o.show['s' + k] = mesh && sc !== 'ambient' ? 1 : 0; o.rows['s' + k] = sideRows(mesh && sc !== 'sidecar' ? 'mTLS · sa/' + pod(k).nm : 'sidecar · proxy'); });
    [0, 1, 2].forEach(c => { o.show['z' + c] = sc === 'ambient' ? 1 : 0; o.rows['z' + c] = ztRows(c); });
    o.show.wp = 0; o.rows.wp = wpRows(); o.show.ist = mesh ? 1 : 0; o.rows.ist = istRows();
    return o;
  }
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { const e = ease(f); o.beams.push({ pts, on: true, dot: f < 1 ? e : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, e, text, tone]);
      if (f < 1) o.dots.push(alongPts(pts, cumLen(pts), e)); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  // o istiod empurra configuração: um ponto desce por cada cabo
  const push = (o, t, a, b, targets) => { o.cab = 'push'; o.cabT = targets.map(n => [n, clamp((t - a) / (b - a))]); return t >= b; };
  const C3 = (...c) => c;   // contadores do mostrador: [rótulo, valor, tom]
  const PEDPAG = route('ped', 'pag', 40, -40), PEDEST = route('ped', 'est', -40, 40), BFFCAT = route('bff', 'cat', -30, -30),
    CATPAG = route('cat', 'pag', 50, 30), BFFPED = route('bff', 'ped', 40, -70), BFFREC = route('bff', 'rec', 60, -60), PEDPAGW = routeWp('ped', 'pag', 40, -40);

  const VS_PED = ['apiVersion: networking.istio.io/v1', 'kind: VirtualService', 'metadata: { name: pedidos }', 'spec:', '  hosts: [pedidos]', '  http:', '  - match:', '    - headers:', '        x-versao: { exact: v2 }', '    route:', '    - destination: { host: pedidos, subset: v2 }', '  - route:', '    - destination: { host: pedidos, subset: v1 }', '      weight: 90', '    - destination: { host: pedidos, subset: v2 }', '      weight: 10'];
  const VS_PAG = ['apiVersion: networking.istio.io/v1', 'kind: VirtualService', 'metadata: { name: pagamentos }', 'spec:', '  hosts: [pagamentos]', '  http:', '  - timeout: 2s', '    retries:', '      attempts: 2', '      retryOn: "503"', '    route:', '    - destination: { host: pagamentos }'];
  const AP = ['apiVersion: security.istio.io/v1', 'kind: AuthorizationPolicy', 'metadata: { name: cobrancas, namespace: loja }', 'spec:', '  selector:', '    matchLabels: { app: pagamentos }', '  action: ALLOW', '  rules:', '  - from:', '    - source:', '        principals: ["loja.local/ns/loja/sa/pedidos"]', '    to:', '    - operation:', '        methods: ["POST"]', '        paths: ["/cobrancas"]'];
  const PA = ['apiVersion: security.istio.io/v1', 'kind: PeerAuthentication', 'metadata: { name: default, namespace: loja }', 'spec:', '  mtls: { mode: STRICT }'];
  const FAULT = (kind) => ['apiVersion: networking.istio.io/v1', 'kind: VirtualService', 'metadata: { name: recomendacoes }', 'spec:', '  hosts: [recomendacoes]', '  http:', '  - fault:', ...(kind === 'abort' ? ['      abort:', '        percentage: { value: 10 }', '        httpStatus: 503'] : ['      delay:', '        percentage: { value: 10 }', '        fixedDelay: 2s']), '    route:', '    - destination: { host: recomendacoes }'];

  const STEPS = {
    sem: [
      { id: 'cobra', dur: 5, title: 'pedidos charges order 1048', yk: 'IN THE CODE · pedidos (Go)',
        yaml: ['// pedidos (Go): each team does its own', 'body := `' + BODY + '`', 'res, err := tlsClient.Post(', '  "https://pagamentos:8443/cobrancas",', '  "application/json", body)', '// TLS wired by hand: Go lib here,', '// Java lib on the other side'],
        ys: ['res, err := tlsClient.Post(', '  ".../cobrancas", "application/json",', '  `{"pedido_id":1048,"valor":94.90}`)', '// TLS wired by hand in the code'],
        story: 'Lena closed order 1048, R$ 94.90, and the bff-app already showed her screen. Now pedidos has to charge it: it sends a POST with the order and the amount to pagamentos. Six services talk like this inside the shop, each in its own Kubernetes pod, and for now there is no mesh at all: the code of each app decides how the call travels.',
        look: 'The light leaves pedidos, runs along the middle aisle and enters pagamentos, which answers 201 in 80 ms.',
        key: 'With no mesh, retry, TLS and metrics are lines of code inside each service.',
        f(o, t) { let ms = 0;
          if (t > 0.3) ms = Math.min(80, (t - 0.3) / 2.6 * 80);
          send(o, t, 0.3, 1.5, PEDPAG, 'POST /cobrancas\n' + BODY, 'hi');
          if (send(o, t, 1.9, 2.9, rev(PEDPAG), '201 Created · 80 ms', 'acc')) { o.res = ['201 Created · 80 ms', '{"pedido_id":1048,"status":"aprovada"}']; ms = 80; }
          o.cnt = C3(['CALLS TO PAGAMENTOS', t > 1.5 ? '1' : '0'], ['CALL TIME', Math.round(ms) + ' ms'], ['WHO DECIDES THE RULE', 'the app code', 'dim']);
          if (t > 3.1) T(o, 'pag', 'charge for 1048\n201 · 80 ms'); } },
      { id: 'times', dur: 6.5, title: 'Each team wrote it their own way', yk: 'IN THE CODE · 3 linguagens',
        yaml: ['# pedidos (Go):      retry 5×, no wait', '# estoque (Java):    HTTP without TLS', '# catalogo (Node.js): measures nothing', '# 3 languages = 3 network libraries', '# changing the rule = changing 3 codebases'],
        story: 'Open the code of the services and each one solved networking its own way. pedidos, in Go, retries 5 times with no wait. estoque, in Java, speaks HTTP without TLS. catalogo, in Node.js, measures neither latency nor errors. Three languages, three libraries, and no rule is the same for everyone.',
        look: 'The pods light up one at a time: pedidos, estoque and catalogo, each with its own line of code in red.',
        key: 'Each team reinvents retry, TLS and metrics, and each one reinvents it differently.',
        f(o, t) { o.cnt = C3(['LANGUAGES', 'Go · Node.js · Java'], ['NETWORK LIBRARIES', '3 (one per language)'], ['RULES THE SAME FOR ALL', '0', 'bad']);
          const k = t < 2 ? 'ped' : t < 3.8 ? 'est' : 'cat';
          if (t > 0.3) { o.on[k] = 1; T(o, k, { ped: 'Go: retry 5×, no wait', est: 'Java: HTTP without TLS', cat: 'Node.js: no metrics' }[k], 'bad'); }
          if (t > 5.4) { o.on.ped = o.on.est = o.on.cat = 2; o.tags.length = 0; T(o, 'est', '3 languages\n3 ways to do networking', 'bad'); }
          o.res = ['each change: 3 PRs, 3 deploys']; } },
      { id: 'aberto', dur: 5.5, title: 'estoque talks in plain text', yk: 'IN THE CODE · estoque (Java)',
        yaml: ['// estoque (Java): plain HTTP server', 'server.port=8080   # no TLS', '// pedidos calls:', 'POST http://estoque:8080/reservas', '{"pedido_id":1048,"produto_id":42}'],
        story: 'Order 1048 is paid, so pedidos reserves the plush cat in estoque. But estoque never turned TLS on: the reservation JSON crosses the cluster network as plain text. Any process that can see that path reads the order, the product and who called.',
        look: 'The light goes from pedidos to estoque, behind it, with the readable JSON in the red bubble.',
        key: 'A service without TLS leaves the conversation of everyone who talks to it wide open.',
        f(o, t) { o.cnt = C3(['ENCRYPTED CALLS', t > 1.6 ? '1 of 2' : '1 of 1', t > 1.6 ? 'bad' : ''], ['pedidos → estoque', t > 1.6 ? 'plain text' : '…', 'bad'], ['WHO PROVES WHO IS WHO', 'nobody', 'bad']);
          send(o, t, 0.3, 1.6, PEDEST, 'POST /reservas\n{"pedido_id":1048,"produto_id":42}', 'bad');
          if (send(o, t, 2.0, 2.9, rev(PEDEST), '201 · reserved', 'hi')) o.res = ['201 Created', '(traveled unencrypted)'];
          if (t > 1.4) T(o, [CX(1) - 40, 280, 8], 'plain text: anyone on\nthe path reads the JSON', 'bad'); } },
      { id: 'cego', dur: 5, title: 'catalogo measures nothing', yk: 'IN THE CODE · catalogo (Node.js)',
        yaml: ["app.get('/produtos/:id', async (req, res) => {", '  res.json(await db.produto(req.params.id))', '})', '// no counter, no histogram,', '// no tracing span'],
        story: 'bff-app asks catalogo for product 42 to build Lena\'s screen. The answer comes back, but how long did it take? How many failed today? catalogo records nothing, so nobody knows it is slow until someone complains.',
        look: 'The light goes from bff-app to catalogo and back; on the display, catalogo\'s latency and error rate stay empty.',
        key: 'Without the same metrics everywhere, the problem shows up first as a customer complaint.',
        f(o, t) { o.cnt = C3(['CATALOGO LATENCY', '— no data', 'bad'], ['ERROR RATE', '— no data', 'bad'], ['TRACING SPANS', '0', 'bad']);
          send(o, t, 0.3, 1.3, BFFCAT, 'GET /produtos/42', 'hi');
          if (send(o, t, 1.6, 2.6, rev(BFFCAT), '200 · gato de pelúcia', 'acc')) o.res = ['200 OK', 'how long? nobody measured'];
          if (t > 2.9) T(o, 'cat', 'slow or broken?\nnobody knows', 'bad'); } },
      { id: 'insiste', dur: 7, title: 'When it fails: 5 retries with no wait', yk: 'IN THE CODE · pedidos (Go)',
        yaml: ['for i := 0; i <= 5; i++ {', '  res, err = tlsClient.Post(url, ct, body)', '  if err == nil && res.StatusCode != 503 {', '    break', '  }', '}   // no pause between attempts'],
        story: 'pagamentos is overloaded and answers 503 to the charge for 1048. The pedidos code retries right away, 5 times, waiting nothing. That is 6 calls in a row on top of a service that was already failing, and every other order in the shop does the same.',
        look: 'pagamentos turns red; the light goes back and forth 6 times in a row and the counter climbs to 6.',
        key: 'Retry with no wait and no limit makes worse the failure it wanted to work around.',
        f(o, t) { o.on.pag = 'bad'; o.rows.pag = appRows('pag', ['503 · overloaded', 'bad'], ['TLS: Java lib']);
          let n = 0; for (let i = 0; i < 6; i++) { const a = 0.4 + i * 0.75; if (t > a) n = i + 1;
            if (t > a && t < a + 0.75) { send(o, t, a, a + 0.35, PEDPAG, i ? `retry ${i}` : 'POST /cobrancas', 'hi', 0); send(o, t, a + 0.38, a + 0.7, rev(PEDPAG), '503', 'bad', 0); } }
          if (t > 5) quiet(o, PEDPAG);
          o.cnt = C3(['CALLS TO PAGAMENTOS', String(n), n > 1 ? 'bad' : ''], ['WAIT BETWEEN THEM', '0 ms', 'bad'], ['RESULT', n ? '503' : '…', 'bad']);
          o.res = n ? [`attempt ${n}: 503 Service Unavailable`] : [];
          if (t > 5) { T(o, 'pag', '6 calls in a row\nwith no pause', 'bad'); T(o, 'ped', '1048 is still uncharged', 'bad'); } } },
    ],
    sidecar: [
      { id: 'injeta', dur: 5.5, title: 'An Envoy joins every pod', yk: 'COMMAND',
        yaml: ['kubectl label namespace loja \\', '  istio-injection=enabled', '# every pod is born with 2 containers:', '#   the app + istio-proxy (Envoy)', '# iptables diverts the pod inbound and', '#   outbound traffic to Envoy'],
        story: 'The idea of the mesh is to take the network out of the code. We turn Istio on in the loja namespace and every pod now comes up with a second container, Envoy, attached to the app. iptables rules send all traffic in and out of the pod through Envoy, and the app does not notice. The shop has 30 pods, so that is 30 Envoys.',
        look: 'An ENVOY box rises at the edge of each pod, on the aisle side; thin cables connect each one to istiod at the back.',
        key: 'Sidecar: a proxy inside every pod, in the path of everything that goes in and out.',
        f(o, t) { const up = t > 0.4; PK.forEach(k => o.show['s' + k] = up ? 1 : 0); o.cab = t > 1.6 ? 'idle' : null;
          const n = Math.round(clamp((t - 0.4) / 1.4) * 30);
          o.cnt = C3(['PODS IN THE SHOP', '30'], ['SIDECARS (ENVOY)', String(n)], ['LINES CHANGED IN THE APP', '0']);
          o.res = n ? [`${n} of 30 pods with app + Envoy`] : [];
          if (t > 2.2) { T(o, 'sped', 'pedidos Envoy'); T(o, 'spag', 'pagamentos Envoy'); } } },
      { id: 'caminho', dur: 6, title: 'The call goes through 2 proxies', yk: 'IN THE CODE · pedidos (Go)',
        yaml: ['// the app is simple again:', 'http.Post("http://pagamentos:8080/cobrancas",', '  "application/json", body)', '// no TLS, no retry in the code:', '// that is Envoy now'],
        story: 'pedidos goes back to calling the plain address, http://pagamentos:8080/cobrancas. The call leaves the app, lands on pedidos\' Envoy, crosses the network to pagamentos\' Envoy and only then reaches the pagamentos app. Two proxies in the path cost about 1 ms: the charge takes 81 ms instead of 80.',
        look: 'The light lights up pedidos\' Envoy, runs along the aisle, lights up pagamentos\' Envoy and enters the app.',
        key: 'With a sidecar, every call crosses 2 proxies: the caller\'s and the receiver\'s.',
        f(o, t) { let ms = 0; if (t > 0.3) ms = Math.min(81, (t - 0.3) / 2.7 * 81);
          send(o, t, 0.3, 1.8, PEDPAG, 'POST /cobrancas\n' + BODY, 'hi');
          if (send(o, t, 2.1, 3.0, rev(PEDPAG), '201 · 81 ms', 'acc')) { o.res = ['201 Created · 81 ms', '(80 from the app + ~1 from the 2 Envoys)']; ms = 81; }
          o.cnt = C3(['PROXIES IN THE PATH', '2'], ['CALL TIME', Math.round(ms) + ' ms'], ['COST OF THE 2 ENVOYS', '~1 ms']);
          if (t > 0.6 && t < 2.4) T(o, 'sped', '1st proxy: pedidos outbound');
          if (t > 1.3 && t < 3.2) T(o, 'spag', '2nd proxy: pagamentos inbound');
          if (t > 3.2) T(o, 'pag', '201 · 81 ms (+1 ms)'); } },
      { id: 'mtls', dur: 6.5, title: 'mTLS: both sides prove who they are', yk: 'ACTIVE RULE · PeerAuthentication', yaml: PA,
        story: 'Between the two Envoys the conversation is now encrypted with mTLS. In the TLS of module 1 only the server showed a certificate; here both sides show one. pedidos\' Envoy says spiffe://loja.local/ns/loja/sa/pedidos and pagamentos\' says its own. istiod issues these certificates and rotates each one before it expires (24 h in the example). Even estoque, which never turned TLS on, now talks encrypted.',
        look: 'The two Envoys show each side\'s SPIFFE identity; the light between them becomes \"mTLS · encrypted\", and so does the one to estoque.',
        key: 'mTLS: it encrypts the conversation and each side proves its identity with a certificate.',
        f(o, t) { PK.forEach(k => o.rows['s' + k] = sideRows(t > 0.6 ? 'mTLS · sa/' + pod(k).nm : 'sidecar · proxy', t > 0.6 ? 'acc' : 'dim'));
          send(o, t, 0.3, 1.6, PEDPAG, 'mTLS · encrypted', 'acc');
          if (t > 0.5 && t < 3.6) { T(o, [CX(1) - 130, 288, 8], 'pedidos shows:\n' + SID('pedidos'), 'acc'); T(o, 'spag', 'pagamentos shows:\n' + SID('pagamentos'), 'acc'); }
          if (send(o, t, 1.9, 2.6, rev(PEDPAG), '201 · encrypted', 'acc')) o.res = ['mTLS handshake ok · 201 Created'];
          send(o, t, 3.6, 4.6, PEDEST, 'mTLS · encrypted', 'acc'); if (send(o, t, 4.8, 5.4, rev(PEDEST), '201', 'acc', 0.3)) o.res = ['pedidos → estoque: encrypted too', '(the estoque code did not change)'];
          o.cnt = C3(['ENCRYPTED CALLS', t > 4.6 ? '2 of 2' : '1 of 1'], ['CERTIFICATES', '2 sides · 24 h'], ['ISSUED BY', 'istiod']);
          if (t > 4.6) T(o, 'sest', 'estoque: encrypted without\nchanging a line', 'acc'); } },
      { id: 'metricas', dur: 6.5, title: 'Free metrics, even on catalogo', yk: 'METRIC GENERATED BY ENVOY',
        yaml: ['istio_requests_total{', '  source_workload="pedidos",', '  destination_workload="pagamentos",', '  response_code="201"}', 'istio_request_duration_milliseconds', '# span: trace_id=7f3a… on every hop'],
        story: 'Since every call goes through an Envoy, each Envoy counts: latency, errors and throughput for each pair of services, in the same format for all. catalogo, which measured nothing, gets numbers without changing a line. And each hop becomes a span with trace_id 7f3a… from module 6, linking the whole order.',
        look: 'Two calls run at the same time; the display gets p50 and p99 for both pairs, including catalogo\'s.',
        key: 'Telemetry comes from the proxy, not the app: the same for every service.',
        f(o, t) { send(o, t, 0.3, 1.5, PEDPAG, 'POST /cobrancas', 'hi', 0.2); send(o, t, 1.8, 2.6, rev(PEDPAG), '201 · 81 ms', 'acc', 0.3);
          send(o, t, 0.6, 1.6, BFFCAT, 'GET /produtos/42', 'hi', 0.2); send(o, t, 1.9, 2.7, rev(BFFCAT), '200 · 12 ms', 'acc', 0.3);
          const on = t > 2.8;
          o.cnt = C3(['pedidos → pagamentos', on ? 'p50 81 · p99 140 ms' : '…'], ['bff-app → catalogo', on ? 'p50 12 · p99 45 ms' : '…'], ['ERRORS · THROUGHPUT', on ? '0.1% · 12 req/s | 0% · 300' : '…']);
          o.res = on ? ['trace_id=7f3a… · 1 span per hop', '(generated by the Envoys)'] : [];
          if (t > 3) T(o, 'scat', 'now catalogo has\np50, p99, errors, throughput', 'acc'); } },
      { id: 'custo', dur: 7.5, title: 'When it fails: replacing Envoy on all 30 pods', yk: 'COMMAND',
        yaml: ['# a security fix shipped for', '#   Envoy: the sidecar only changes', '#   when the pod is recreated', 'kubectl rollout restart deployment -n loja', '# 30 pods × (0.1 vCPU + 50 MB)', '#   = 3 vCPU and 1.5 GB of proxy alone'],
        story: 'A security fix ships for Envoy. Since it lives inside each pod, the only way to swap it is to recreate the pods: all 30, one by one, with the app along. The math: 0.1 vCPU and 50 MB per sidecar times 30 pods is 3 vCPU and 1.5 GB of proxy alone, plus ~1 ms on every call.',
        look: 'The Envoys sink and come back one at a time; the restarted pods counter climbs to 30.',
        key: 'The price of the sidecar: one proxy per pod to pay for in CPU, memory and restarts.',
        f(o, t) { const n = Math.min(30, Math.floor(clamp((t - 0.4) / 5) * 30 + (t > 0.4 ? 1 : 0)));
          PK.forEach((k, i) => { const ph = (t - 0.4 - i * 0.8); if (ph > 0 && ph < 0.7) { o.show['s' + k] = 0; } if (ph > 0 && ph < 1.4) o.on['s' + k] = 'bad'; });
          o.cnt = C3(['PODS RESTARTED', `${n} of 30`, n < 30 ? 'bad' : ''], ['COST OF THE SIDECARS', '3 vCPU · 1.5 GB'], ['EXTRA LATENCY', '~1 ms per call']);
          o.res = n < 30 ? ['recreating pods: app + new Envoy'] : ['30 pods recreated to swap the proxy'];
          if (t > 5.8) T(o, 'sped', 'swapping the proxy = restarting\nthe app too, 30 times', 'bad'); } },
    ],
    regras: [
      { id: 'istiod', dur: 6, title: 'istiod keeps the rules and pushes them', yk: 'COMMAND',
        yaml: ['kubectl apply -f regras.yaml', '# istiod stores and pushes via xDS:', 'VirtualService       route, retry, timeout', 'DestinationRule      balancing, v1/v2', 'AuthorizationPolicy  who calls whom', 'PeerAuthentication   mTLS STRICT'],
        story: 'The Envoys are in the path, but who tells them what to do? The control plane. In Istio it is called istiod: it keeps the rules, written in YAML, and each service\'s certificate, and pushes everything to the 30 proxies through Envoy\'s xDS API. The Envoys form the data plane, which executes.',
        look: 'istiod lights up and a point of light goes down each cable to an Envoy; each one lights up when it receives.',
        key: 'The control plane decides and distributes; the data plane (the proxies) executes on every call.',
        f(o, t) { o.on.ist = t > 0.3 && t < 3 ? 1 : 2; const sides = PK.map(k => 's' + k);
          if (t > 0.8) push(o, t, 0.8, 2.2, sides);
          const n = t > 2.2 ? 30 : Math.round(clamp((t - 0.8) / 1.4) * 30); if (t > 2.2) sides.forEach(s => { o.on[s] = 2; o.rows[s] = sideRows('config v1 · xDS', 'acc'); });
          o.cnt = C3(['RULES IN ISTIOD', '4 kinds'], ['PROXIES CONFIGURED', `${n} of 30`], ['CERTIFICATES', '1 per service · 24 h']);
          o.res = t > 2.2 ? ['30 Envoys with the same configuration'] : [];
          if (t > 2.6) T(o, 'ist', 'control plane: decides', 'acc'); if (t > 2.8) T(o, 'sped', 'data plane: executes', 'acc'); } },
      { id: 'canary', dur: 7.5, title: 'Canary: 10% of calls go to pedidos v2', yk: 'ACTIVE RULE · VirtualService', yaml: VS_PED,
        ys: ['kind: VirtualService  # pedidos', '- match: x-versao: v2 → subset v2', '- route:', '    v1  weight: 90', '    v2  weight: 10'],
        story: 'The checkout team launched pedidos v2 and wants to test it with few users. The rule in istiod sends 90% of calls to v1 and 10% to v2, by weight. Of the bff-app\'s 10 calls, 1 lands on v2. And whoever sends the header x-versao: v2 always goes to v2.',
        look: 'Ten lights go from bff-app to pedidos; the 7th lights up as v2. The last one, with the header, also goes to v2.',
        key: 'Canary: a small slice of traffic on the new version, decided in the mesh.',
        f(o, t) { let n1 = 0, n2 = 0;
          for (let i = 0; i < 10; i++) { const a = 0.3 + i * 0.5; if (t > a + 0.4) { if (i === 6) n2++; else n1++; } if (t > a && t < a + 0.5) send(o, t, a, a + 0.4, BFFPED, i === 6 ? 'v2' : '', i === 6 ? 'acc' : 'hi', 0.1); }
          if (t > 5.6) { send(o, t, 5.6, 6.3, BFFPED, 'x-versao: v2', 'acc', 0.4); if (t > 6.3) n2++; }
          if (t > 6.5 || t < 0.3) quiet(o, BFFPED);
          o.rows.ped = appRows('ped', [`v1: ${n1} calls`, ''], [`v2: ${n2} call${n2 === 1 ? '' : 's'}`, n2 ? 'acc' : 'dim']);
          o.cnt = C3(['pedidos v1', String(n1)], ['pedidos v2', String(n2)], ['WEIGHT', '90 / 10']);
          o.res = t > 6.3 ? ['x-versao: v2 → always v2'] : n1 + n2 ? [`${n1 + n2} calls: ${n1} v1, ${n2} v2`] : [];
          if (t > 5.4) T(o, 'ped', '10 calls: 9 on v1, 1 on v2', 'acc'); } },
      { id: 'retry', dur: 6.5, title: 'Retry: up to 2 times, only on 503', yk: 'ACTIVE RULE · VirtualService', yaml: VS_PAG,
        ys: ['kind: VirtualService  # pagamentos', 'timeout: 2s', 'retries:', '  attempts: 2', '  retryOn: "503"', '# Envoy wait between attempts: 25 ms'],
        story: 'pagamentos answers 503 once to the charge for 1048. Now it is pedidos\' Envoy that retries, with a rule: at most 2 times, only for 503, waiting 25 ms between attempts. The second one gets through. The pedidos app only sees the 201, in 187 ms (81 + 25 + 81). Repeating is only possible because charging the same pedido_id 1048 twice does not create two charges.',
        look: 'The first light comes back red only as far as pedidos\' Envoy, which waits and sends again; the second goes through to the app.',
        key: 'Retry in the mesh: with a limit, a wait, only for errors worth repeating and only on idempotent operations.',
        f(o, t) { let n = 0, ms = 0; const half = route('ped', 'pag', 40, -40);
          if (send(o, t, 0.3, 1.3, half, 'POST /cobrancas', 'hi', 0.1)) n = 1; if (t > 0.3) ms = Math.min(81, (t - 0.3) / 1.6 * 81);
          if (t > 0.3) n = 1; if (t > 1.3 && t < 2.2) o.on.pag = 'bad';
          if (send(o, t, 1.5, 2.2, rev(half).slice(0, 3).concat([[CX(1) + 40, EDGE[1] - 4, Z]]), '503 · attempt 1', 'bad', 0.1)) { o.on.sped = 1; }
          if (t > 2.2) ms = 81 + Math.min(25, (t - 2.2) / 0.5 * 25);
          if (t > 2.7) { n = 2; ms = 106 + Math.min(81, (t - 2.7) / 1.4 * 81); }
          send(o, t, 2.7, 3.5, half, 'retry after 25 ms', 'acc', 0.1);
          if (send(o, t, 3.6, 4.2, rev(half), '201 · 187 ms', 'acc')) { ms = 187; o.res = ['attempt 1: 503 · attempt 2: 201', 'the app sees only the 201 · 187 ms']; }
          o.cnt = C3(['ATTEMPTS', `${n} of 3 at most`], ['TOTAL TIME', Math.round(ms) + ' ms'], ['THE PEDIDOS APP SEES', t > 4.2 ? '201' : '…']);
          if (t > 2.1 && t < 2.8) T(o, 'sped', 'Envoy: 503, waits 25 ms', 'bad');
          if (t > 4.4) T(o, 'ped', '81 + 25 + 81 = 187 ms\nthe app never saw the 503'); } },
      { id: 'timeout', dur: 6, title: 'Timeout: 2 s and Envoy cuts it off', yk: 'ACTIVE RULE · VirtualService', yaml: VS_PAG,
        ys: ['kind: VirtualService  # pagamentos', 'http:', '- timeout: 2s', '  route:', '  - destination: { host: pagamentos }'],
        story: 'Now pagamentos does not go down, it hangs: it receives the charge and does not answer. With no limit, pedidos would wait with the connection stuck. With a 2 s timeout in the rule, pedidos\' Envoy cuts the wait and returns 504 to the app, which can warn Lena or try later.',
        look: 'The light reaches pagamentos and stops; the display clock runs up to 2,000 ms and the answer comes back red from Envoy.',
        key: 'Timeout in the mesh: nobody waits longer than the rule allows.',
        f(o, t) { const run = clamp((t - 1.1) / 2.6); let ms = t > 1.1 ? Math.round(run * 2000) : 0;
          send(o, t, 0.3, 1.1, PEDPAG, 'POST /cobrancas', 'hi', 3);
          if (t > 1.1) { o.on.pag = 'bad'; o.rows.pag = appRows('pag', ['hung: not answering', 'bad'], [`${ms} ms…`, 'bad']); }
          if (send(o, t, 3.7, 4.4, rev(route('ped', 'pag', 40, -40)).slice(0, 2).concat([[CX(2) - 40, LY, Z], [CX(1) + 40, LY, Z], edge('ped', 40)]), '504 · upstream request timeout', 'bad')) o.res = ['504 Gateway Timeout', 'upstream request timeout'];
          if (t > 3.7) ms = 2000;
          o.cnt = C3(['WAITING FOR', `${ms} ms`, ms >= 2000 ? 'bad' : ''], ['RULE LIMIT', '2 s'], ['RESPONSE', t > 4.4 ? '504' : '…', 'bad']);
          if (t > 4.5) T(o, 'sped', 'Envoy cut it at 2 s', 'bad'); } },
      { id: 'authz', dur: 7, title: 'Only pedidos can charge: catalogo gets 403', yk: 'ACTIVE RULE · AuthorizationPolicy', yaml: AP,
        ys: ['kind: AuthorizationPolicy', 'selector: app: pagamentos', 'action: ALLOW', 'from: loja.local/ns/loja/sa/pedidos', 'to: POST /cobrancas'],
        story: 'The authorization policy says: on pagamentos, POST /cobrancas only for pedidos\' identity. The check is done by pagamentos\' Envoy, looking at the certificate of the caller. pedidos gets through. catalogo tries the same POST and gets 403 RBAC: access denied, with no line of code in pagamentos.',
        look: 'pedidos\' light enters pagamentos; catalogo\'s stops at pagamentos\' Envoy, which turns red and returns 403.',
        key: 'Authorization policy: who can call what, checked by identity at the proxy.',
        f(o, t) { send(o, t, 0.3, 1.2, PEDPAG, 'POST /cobrancas', 'hi', 0.1); const ok = send(o, t, 1.4, 2.1, rev(PEDPAG), '201', 'acc', 0.2);
          const cut = CATPAG.slice(0, 3).concat([[CX(2) + 30, SIDEY[1] + 4, Z]]);
          send(o, t, 2.8, 4.0, cut, 'POST /cobrancas · sa/catalogo', 'bad', 0.1);
          const deny = t > 4.0; if (deny && t < 5.6) o.on.spag = 'bad';
          if (deny) o.rows.spag = sideRows('403 for sa/catalogo', 'bad');
          if (send(o, t, 4.3, 5.3, rev(cut), '403 RBAC: access denied', 'bad')) o.res = ['catalogo → 403', 'RBAC: access denied'];
          else if (ok) o.res = ['pedidos → 201 Created'];
          o.cnt = C3(['pedidos → POST /cobrancas', ok ? '201' : '…'], ['catalogo → POST /cobrancas', deny ? '403' : '…', 'bad'], ['LINES IN PAGAMENTOS', '0']);
          if (t > 4.2) T(o, 'spag', 'sa/catalogo cannot\nPOST /cobrancas → 403', 'bad'); } },
      { id: 'cai', dur: 7.5, title: 'When it fails: istiod goes down', yk: 'COMMAND',
        yaml: ['# istiod is down', 'kubectl apply -f canary-50.yaml', '# Kubernetes stores the new rule,', '#   but no Envoy receives it', '# Envoys keep the last', '#   configuration (canary 10%)'],
        story: 'istiod goes down. Do the calls stop? No: each Envoy already has the last configuration and keeps executing. The charge for 1048 goes out with a 201 in 81 ms. What stops is change: the team raises the canary to 50% and no proxy finds out. If istiod stays down for more than 24 h, the certificates expire without rotation, and then mTLS stops everything.',
        look: 'istiod turns red and the cables are cut halfway; the light between pedidos and pagamentos keeps running as normal.',
        key: 'Without the control plane, the data plane keeps the last rule; only new rules stop arriving.',
        f(o, t) { o.on.ist = 'bad'; o.rows.ist = istRows(['DOWN', 'bad'], ['new rule: canary 50%', 'dim'], ['reaches nobody', 'bad']); o.cab = 'bad';
          send(o, t, 0.6, 1.8, PEDPAG, 'POST /cobrancas', 'hi', 0.1); if (send(o, t, 2.0, 2.8, rev(PEDPAG), '201 · 81 ms', 'acc', 0.4)) o.res = ['201 Created · 81 ms', '(with the previous configuration)'];
          o.cnt = C3(['CALLS', 'keep going · 201'], ['NEW RULE (50%)', 'does not arrive', 'bad'], ['CERTIFICATES', t > 4.6 ? 'expire in 24 h' : 'valid until expiry', t > 4.6 ? 'bad' : '']);
          if (t > 0.4) T(o, 'ist', 'istiod is down: nothing new\nreaches the proxies', 'bad');
          if (t > 3) T(o, 'pag', 'calls keep going\nwith the last rule');
          if (t > 4.6) T(o, 'sped', 'down for over 24 h:\ncertificate expires, mTLS stops', 'bad'); } },
    ],
    falha: [
      { id: 'aborto', dur: 7, title: 'Fault injection: 10% of calls to recomendacoes get a 503', yk: 'ACTIVE RULE · VirtualService', yaml: FAULT('abort'),
        ys: ['kind: VirtualService  # recomendacoes', 'fault:', '  abort:', '    percentage: { value: 10 }', '    httpStatus: 503'],
        story: 'The bff-app from module 9 has a fallback: if recomendacoes fails, the screen goes out without \"customers also bought\". But does it really work? The mesh lets us test without breaking anything for real: the rule makes bff-app\'s Envoy return 503 on 10% of calls to recomendacoes. Of 10, one is cut on the way out and never gets there.',
        look: 'Ten lights go from bff-app to recomendacoes; the 4th stops at bff-app\'s own Envoy, which turns red.',
        key: 'Fault injection: the mesh creates the failure on purpose to test whoever depends on it.',
        f(o, t) { let n = 0, got = 0, ab = 0;
          for (let i = 0; i < 10; i++) { const a = 0.3 + i * 0.5; if (t > a) n = i + 1;
            if (i === 3) { const p = [edge('bff', 60), [CX(0) + 60, SIDEY[1] + 6, Z]]; if (t > a && t < a + 1.2) { send(o, t, a, a + 0.25, p, '', 'bad', 0.9); o.on.sbff = 'bad'; } if (t > a + 0.25) ab = 1; }
            else { if (t > a + 0.4) got++; if (t > a && t < a + 0.5) send(o, t, a, a + 0.4, BFFREC, '', 'hi', 0.1); } }
          if (t > 5.4 || t < 0.3) quiet(o, BFFREC);
          o.rows.rec = appRows('rec', [`received: ${got}`, ''], ['(the injected one never arrives)', 'dim']);
          if (ab) o.rows.bff = appRows('bff', ['1 × 503 → fallback', 'acc'], ['"recomendado": []', 'acc']);
          o.cnt = C3(['BFF-APP CALLS', `${n} of 10`], ['503s INJECTED', String(ab), ab ? 'bad' : ''], ['LENA SEES', ab ? 'screen without the section' : 'full screen']);
          o.res = ab ? ['503 · fault filter abort', 'bff-app: fallback, "recomendado": []'] : [];
          if (t > 2 && t < 4.5) T(o, 'sbff', 'Envoy itself returns 503\n(fault filter abort)', 'bad');
          if (t > 5.6) T(o, 'bff', 'fallback worked\nLena does not even notice'); } },
      { id: 'atraso', dur: 6.5, title: '2 s of delay: does the bff-app timeout hold?', yk: 'ACTIVE RULE · VirtualService', yaml: FAULT('delay'),
        ys: ['kind: VirtualService  # recomendacoes', 'fault:', '  delay:', '    percentage: { value: 10 }', '    fixedDelay: 2s'],
        story: 'Now the failure is slowness: 10% of calls to recomendacoes get 2 s of delay. bff-app waits 100 ms at most (the module 9 timeout). On the delayed call it gives up at 100 ms and answers the screen without the section; the delayed answer would arrive at 2,000 ms, for nobody.',
        look: 'The light leaves bff-app and stays stuck at its Envoy; the clock stops at 100 ms and the screen goes out without waiting.',
        key: 'Injected delay shows whether the timeouts are right before a real incident.',
        f(o, t) { const p = [edge('bff', 60), [CX(0) + 60, SIDEY[1] + 6, Z]]; send(o, t, 0.3, 0.6, p, '2 s delay', 'bad', 5);
          const ms = t < 0.6 ? 0 : Math.min(100, Math.round((t - 0.6) / 1.4 * 100)); if (t > 0.6) o.on.sbff = 1;
          if (t > 2.0) { o.on.bff = 1; o.rows.bff = appRows('bff', ['100 ms: gave up', 'acc'], ['"recomendado": []', 'acc']); }
          send(o, t, 2.2, 3.0, LENA_R.slice().reverse(), 'screen in ~100 ms, no section', 'acc'); o.lena = true;
          const late = t > 4.2 ? 2000 : t > 2 ? 100 + Math.round((t - 2) / 2.2 * 1900) : ms;
          o.cnt = C3(['INJECTED DELAY', '2 s'], ['BFF-APP TIMEOUT', '100 ms'], ['THE ANSWER WOULD COME IN', `${late} ms`, late > 100 ? 'bad' : '']);
          o.res = t > 2 ? ['bff-app: timeout at 100 ms', 'screen goes out without "also bought"'] : [`waiting: ${ms} ms`];
          if (t > 4.4) T(o, 'sbff', 'the 2,000 ms answer\nwould arrive for nobody', 'bad'); } },
      { id: 'tempestade', dur: 9, title: 'When it fails: 1 tap, 27 calls', yk: 'RETRY IN 3 LAYERS',
        yaml: ['# each layer tries 3 times:', 'Lena app → bff-app:       3', 'bff-app → pedidos:        × 3', 'pedidos → pagamentos:     × 3', '# = 3 × 3 × 3 = 27 on pagamentos', '# and it was already failing'],
        story: 'Now pagamentos really goes down and answers 503 to everything. Lena\'s app tries bff-app 3 times, bff-app tries pedidos 3 times and pedidos tries pagamentos 3 times. Each layer multiplies the one above: 3 × 3 × 3 = 27 calls on pagamentos for a single tap, just when it needed room to recover.',
        look: 'Lena taps once; the counters over the pods climb: 3 on bff-app, 9 on pedidos and 27 on pagamentos, in red.',
        key: 'Retry storm: attempts in several layers multiply.',
        f(o, t) { o.lena = true; o.on.pag = 'bad'; const f = clamp((t - 0.5) / 6.5);
          const c1 = Math.min(3, Math.ceil(f * 3)), c2 = Math.min(9, Math.ceil(f * 9)), c3 = Math.min(27, Math.ceil(f * 27));
          const pulse = (a, k) => { const ph = ((t - 0.5) * k) % 1; return ph; };
          if (t > 0.5 && t < 7) { o.beams.push({ pts: LENA_R, on: true, dot: pulse(0, 0.46), tone: 'bad' }, { pts: BFFPED, on: true, dot: pulse(0, 1.38), tone: 'bad' }, { pts: PEDPAG, on: true, dot: pulse(0, 4.15), tone: 'bad' });
            o.on.bff = 1; o.on.ped = 1; o.msgs.push([PEDPAG, 0.5, '503 · 503 · 503', 'bad']); }
          else quiet(o, LENA_R, BFFPED, PEDPAG);
          o.rows.bff = appRows('bff', [`received: ${c1}`, c1 ? 'bad' : 'dim'], ['tries pedidos 3×', 'dim']);
          o.rows.ped = appRows('ped', [`received: ${c2}`, c2 ? 'bad' : 'dim'], ['tries pagamentos 3×', 'dim']);
          o.rows.pag = appRows('pag', [`received: ${c3}`, 'bad'], ['503 to everything', 'bad']);
          o.cnt = C3(['bff-app receives', String(c1)], ['pedidos receives', String(c2)], ['pagamentos receives', String(c3), 'bad']);
          o.res = [`${c1} × 3 = ${c2} · ${c2} × 3 = ${c3}`];
          if (t > 7) { T(o, 'pag', '27 calls\nfrom 1 tap by Lena', 'bad'); T(o, 'bff', '3 × 3 × 3 = 27', 'bad'); } } },
      { id: 'orcamento', dur: 7, title: 'The fix: retry in one place only', yk: 'ACTIVE RULE · VirtualService', yaml: VS_PAG,
        ys: ['# retry on the last hop only, in the mesh:', 'kind: VirtualService  # pagamentos', 'retries: { attempts: 2, retryOn: "503" }', '# Lena app and bff-app: no retry', '# = 1 × 1 × 3 = 3 on pagamentos'],
        story: 'The fix is to decide in one place who retries. The retries leave the code of the app and of bff-app and stay only in the mesh rule, on the pedidos → pagamentos hop: 1 attempt and up to 2 retries. The same tap from Lena now reaches pagamentos 3 times, not 27. The mesh also lets you set a retry budget, a cap on repeats for the whole service.',
        look: 'Lena taps again; the counters stop at 1, 1 and 3.',
        key: 'Retry with a budget and on one hop only: the math closes at 3 instead of 27.',
        f(o, t) { o.lena = true; o.on.pag = 'bad';
          send(o, t, 0.4, 1.0, LENA_R, 'tap', 'hi', 0.2); send(o, t, 1.1, 1.8, BFFPED, '', 'hi', 0.2);
          let c3 = 0; for (let i = 0; i < 3; i++) { const a = 1.9 + i * 0.9; if (t > a + 0.4) c3 = i + 1; if (t > a && t < a + 0.9) { send(o, t, a, a + 0.4, PEDPAG, i ? `retry ${i} · 25 ms` : 'attempt 1', 'hi', 0); send(o, t, a + 0.42, a + 0.8, rev(PEDPAG), '503', 'bad', 0); } }
          if (t > 4.6) quiet(o, PEDPAG);
          const c1 = t > 1.0 ? 1 : 0, c2 = t > 1.8 ? 1 : 0;
          o.rows.bff = appRows('bff', [`received: ${c1}`, ''], ['no retry of its own', 'dim']); o.rows.ped = appRows('ped', [`received: ${c2}`, ''], ['retry: in the mesh', 'acc']);
          o.rows.pag = appRows('pag', [`received: ${c3}`, c3 ? 'acc' : 'dim'], ['503 to everything', 'bad']);
          o.cnt = C3(['bff-app receives', String(c1)], ['pedidos receives', String(c2)], ['pagamentos receives', String(c3), 'acc']);
          o.res = c3 === 3 ? ['1 × 1 × 3 = 3 (before: 27)', 'pagamentos gets room to recover'] : [];
          if (t > 5) T(o, 'pag', '3 calls, not 27'); } },
    ],
    ambient: [
      { id: 'antes', dur: 5, title: 'Before: 30 sidecars, 3 vCPU and 1.5 GB', yk: 'SIDECAR MATH',
        yaml: ['# 1 Envoy per pod:', '30 pods × 0.1 vCPU = 3 vCPU', '30 pods × 50 MB    = 1.5 GB', '# 2 proxies per call: ~1 ms', '# replacing Envoy = recreating 30 pods'],
        story: 'Remember the sidecar math? That is 30 Envoys, one per pod, each with 0.1 vCPU and 50 MB: 3 vCPU and 1.5 GB of proxy alone, and the shop runs on 3 nodes. Istio\'s ambient mode asks: what if the proxy lived on the node, not in the pod?',
        look: 'The Envoys are in every pod; the charge for 1048 goes through the two on its path.',
        key: 'The cost of the sidecar grows with the number of pods, not nodes.',
        f(o, t) { PK.forEach(k => o.show['s' + k] = 1); o.show.z0 = o.show.z1 = o.show.z2 = 0;
          send(o, t, 0.3, 1.4, PEDPAG, 'POST /cobrancas', 'hi', 0.1); if (send(o, t, 1.6, 2.4, rev(PEDPAG), '201 · 81 ms', 'acc', 0.3)) o.res = ['201 · 2 sidecars in the path'];
          o.cnt = C3(['PROXIES', '30 sidecars'], ['PROXY vCPU', '3'], ['PROXY MEMORY', '1.5 GB']);
          if (t > 2.6) T(o, 'sped', 'each: 0.1 vCPU · 50 MB\n× 30 pods', 'bad'); } },
      { id: 'ztunnel', dur: 6.5, title: 'Sidecars out: one ztunnel per node', yk: 'COMMAND',
        yaml: ['kubectl label namespace loja \\', '  istio.io/dataplane-mode=ambient', '# pods go back to having only the app', '# 1 ztunnel per node (DaemonSet):', '#   L4, mTLS and identity', '# 3 nodes → 3 ztunnels'],
        story: 'We switch the namespace to ambient mode. The Envoys leave the pods and a ztunnel comes up on each node, a small proxy that handles layer 4 only: mTLS and identity. With 3 nodes, that is 3 ztunnels instead of 30 sidecars. In the example, each ztunnel costs the same as a sidecar: 0.3 vCPU and 150 MB in total.',
        look: 'The ENVOY boxes sink into the pods and 3 ZTUNNEL boxes rise in the aisle, one per node.',
        key: 'Ambient: the L4 proxy leaves the pod and goes to the node, one per node.',
        f(o, t) { const off = t > 0.5, on = t > 1.6; PK.forEach(k => o.show['s' + k] = off ? 0 : 1); [0, 1, 2].forEach(c => o.show['z' + c] = on ? 1 : 0); o.cab = t > 2.2 ? 'idle' : null;
          const k = clamp((t - 0.5) / 2.5), v = 3 - k * 2.7, mb = 1500 - k * 1350;
          o.cnt = C3(['PROXIES', on ? '3 ztunnels' : off ? '…' : '30 sidecars'], ['PROXY vCPU', dec(v)], ['PROXY MEMORY', mb >= 1000 ? dec(mb / 1000) + ' GB' : Math.round(mb) + ' MB']);
          o.res = on ? ['pods with 1 container only: the app'] : [];
          if (t > 3.4) { T(o, 'z1', '1 ztunnel per node\n3 instead of 30', 'acc'); } } },
      { id: 'l4', dur: 6, title: 'pedidos → pagamentos through the ztunnels', yk: 'ACTIVE RULE · PeerAuthentication', yaml: PA,
        story: 'The charge for 1048 leaves pedidos and is captured by node 2\'s ztunnel, which opens an mTLS tunnel (HBONE, port 15008) to node 3\'s ztunnel, where pagamentos is. The identity stays the same: spiffe://loja.local/ns/loja/sa/pedidos. Encryption and \"who is who\" still hold, with no proxy inside the pods.',
        look: 'The light lights up node 2\'s ztunnel, runs through the tunnel and lights up node 3\'s ztunnel before entering pagamentos.',
        key: 'ztunnel: mTLS and identity at L4, one proxy per node.',
        f(o, t) { send(o, t, 0.3, 1.8, PEDPAG, 'mTLS (HBONE) · 15008', 'acc');
          if (send(o, t, 2.1, 3.0, rev(PEDPAG), '201', 'acc')) o.res = ['201 Created', 'mTLS tunnel between nodes 2 and 3'];
          o.cnt = C3(['PROXIES IN THE PATH', '2 ztunnels'], ['IDENTITY', 'sa/pedidos → sa/pagamentos'], ['vCPU · MEMORY', '0.3 · 150 MB']);
          if (t > 0.6 && t < 3.2) T(o, 'z1', 'I am ' + SID('pedidos'), 'acc');
          if (t > 3.2) T(o, 'z2', 'ztunnel reads L4: who it is,\nwhere it goes. Not the HTTP', 'hi'); } },
      { id: 'waypoint', dur: 7.5, title: 'L7 needs a waypoint', yk: 'COMMAND',
        yaml: ['istioctl waypoint apply -n loja', 'kubectl label service pagamentos \\', '  istio.io/use-waypoint=waypoint', '# retry on 503, x-versao, POST /cobrancas:', '#   all of this is L7 and lives in the waypoint', '# 1 waypoint: + 0.1 vCPU · 50 MB'],
        story: 'Retry on 503, the x-versao header and the POST /cobrancas of the policy are HTTP things, layer 7, which ztunnel does not read. For that a waypoint comes in: one Envoy per namespace (or per service), only where it is needed. The charge now goes from node 2\'s ztunnel to the waypoint and from there to node 3\'s ztunnel. pagamentos\' 503 gets a retry after 25 ms again.',
        look: 'The WAYPOINT rises at the end of the aisle; the light detours through it, comes back red once and gets through the second time.',
        key: 'Waypoint: the L7 Envoy, one per namespace, only when the rule needs to read HTTP.',
        f(o, t) { o.show.wp = t > 0.3 ? 1 : 0; let n = 0;
          if (send(o, t, 0.9, 2.3, PEDPAGW, 'POST /cobrancas', 'hi', 0.1)) n = 1; if (t > 0.9) n = 1;
          if (t > 2.3 && t < 3.0) { o.on.pag = 'bad'; o.on.wp = 'bad'; }
          const back = rev(PEDPAGW).slice(0, 5); send(o, t, 2.4, 3.0, back, '503', 'bad', 0.1);
          if (t > 3.1) o.on.wp = 1; if (t > 3.3) n = 2;
          send(o, t, 3.3, 4.0, PEDPAGW.slice(4), 'retry after 25 ms', 'acc', 0.1);
          if (send(o, t, 4.2, 5.4, rev(PEDPAGW), '201', 'acc')) o.res = ['503 → retry at the waypoint → 201', 'pedidos only sees the 201'];
          o.rows.wp = wpRows(t > 3.1 ? 'retry 2× · 503' : 'L7 · ns loja', t > 3.1 ? 'acc' : 'dim');
          o.cnt = C3(['PROXIES', '3 ztunnels + 1 waypoint'], ['vCPU · MEMORY', '0.4 · 200 MB'], ['ATTEMPTS', n ? `${n}` : '…']);
          if (t > 5.4) T(o, 'wp', 'L7 only where needed\n0.4 vCPU in total (was 3)'); } },
      { id: 'semwp', dur: 7.5, title: 'When it fails: an L7 rule with no waypoint', yk: 'ACTIVE RULE · AuthorizationPolicy', yaml: AP,
        ys: ['kind: AuthorizationPolicy  # pagamentos', 'from: loja.local/ns/loja/sa/pedidos', 'to: POST /cobrancas   ← L7', '# with no waypoint, ztunnel enforces it', '# it does not read HTTP: the rule becomes DENY'],
        story: 'Go back to before the waypoint, with the policy \"only pedidos does POST /cobrancas\" already applied. The one receiving the call is node 3\'s ztunnel, and it sees neither method nor path. Instead of letting it through wrongly, Istio makes the rule fail closed: it becomes DENY. Even pedidos\' charge, which should pass, is refused.',
        look: 'The waypoint disappears; pedidos\' light reaches node 3\'s ztunnel, which turns red and returns the refusal.',
        key: 'An L7 rule needs an L7 proxy; with no waypoint, ztunnel denies for safety.',
        f(o, t) { const cut = PEDPAG.slice(0, 3).concat([[CX(2) - 40, ZTY + ZTD + 2, Z]]);
          send(o, t, 0.4, 1.8, cut, 'POST /cobrancas · sa/pedidos', 'hi', 0.1);
          const deny = t > 1.8; if (deny) { o.on.z2 = 'bad'; o.rows.z2 = ztRows(2, 'regra L7 → DENY', 'bad'); }
          if (send(o, t, 2.1, 3.3, rev(cut), 'connection refused', 'bad')) o.res = ['connection refused by ztunnel', '1048 was not charged'];
          o.cnt = C3(['pedidos → pagamentos', deny ? 'refused' : '…', 'bad'], ['THE RULE ASKS FOR', 'POST /cobrancas (L7)'], ['ZTUNNEL SEES', 'L4 only → denies', 'bad']);
          if (t > 3.4) T(o, 'z2', 'I do not read HTTP: when in doubt,\nI deny (even pedidos)', 'bad');
          if (t > 4.6) T(o, 'pag', 'fix: the waypoint\nfrom the previous step', 'acc'); } },
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
  // tamanhos por tipo de peça: [nome, linhas]; nenhuma linha abaixo de 8 unidades (texto fino some no claro)
  const SIZES = { app: [13, 9.6, 13.2], side: [10.5, 8.6, 0], zt: [10.5, 8.8, 0], wp: [10.5, 8.6, 11], ist: [11.5, 8.6, 11.4] };
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const [s1, s2, lh] = SIZES[Bk.kind];
    x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi;
    const name = Bk.kind === 'app' ? d.name : d.name;
    if (Bk.kind === 'side' || Bk.kind === 'zt') {   // uma linha: NOME · estado (a peça é rasa)
      const y = H_ / 2; fitFont(x, u, name, s1, 60); x.fillText(name, u(5), u(y)); const nw = x.measureText(name).width / cv.P;
      if (Bk.kind === 'zt') { x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.textAlign = 'right'; x.fillText(d.lang, u(W_ - 5), u(y - 6)); x.textAlign = 'left';
        const [t2, tn] = d.rows[0]; x.fillStyle = toneC(tn); fitFont(x, u, t2, s2, W_ - 10); x.fillText(t2, u(5), u(y + 8)); x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; fitFont(x, u, name, s1, 60); x.fillText(name, u(5), u(y - 6)); }
      else { const [t2, tn] = d.rows[0]; x.fillStyle = toneC(tn); fitFont(x, u, t2, s2, W_ - nw - 16); x.fillText(t2, u(nw + 11), u(y + 0.4)); }
    } else {
      let y = lh * 0.62; fitFont(x, u, name, s1, W_ - 70); x.fillText(name, u(5), u(y));
      if (d.lang) { x.fillStyle = INK(); x.textAlign = 'right'; x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText(d.lang, u(W_ - 5), u(y)); x.textAlign = 'left'; }
      y += lh * 0.5;
      for (const [text, tn] of d.rows) { const l2 = s2 * 1.4; y += l2 / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s2, W_ - 10); x.fillText(text, u(5), u(y)); y += l2 / 2; }
    }
    if (on === 'bad' && Bk.kind === 'ist') { x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(W_ - 34), u(6)); x.lineTo(u(W_ - 10), u(30)); x.moveTo(u(W_ - 10), u(6)); x.lineTo(u(W_ - 34), u(30)); x.stroke(); }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawNodes() { if (!once('nodes', theme + accent.getHex() + sc)) return;
    NODE.forEach((cv, c) => { const { x, P } = cv, u = v => v * P; x.clearRect(0, 0, cv.c.width, cv.c.height); x.fillStyle = theme === 'light' ? '#f1f1f0' : '#1b1c1f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = INK(); x.font = `700 ${u(9.6)}px ${MONO3}`;
      x.fillText(`NODE ${c + 1}`, u(2), u(7.6)); x.textAlign = 'right'; x.fillText(c === 0 ? 'bff-app · catalogo' : c === 1 ? 'pedidos · estoque' : 'pagamentos · recomendacoes', u(cv.c.width / P - 2), u(7.6)); cv.tex.needsUpdate = true; }); }
  function drawScreen(o) {
    const s = cur(), yl = s.ys || s.yaml;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 220) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 12 + i * 44; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 19, 220); x.fillText(val, u(10), u(Y + 18)); });
    const L0 = 252; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(137)); x.stroke();
    lbl(s.yk || 'ACTIVE RULE', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(25 + i * 12.6)); });
    lbl('RESPOSTA', L0, 104);
    x.fillStyle = o.res.length ? acc : INK(); (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { if (/^(5|4)\d\d|recus|refus|DENY/.test(l)) x.fillStyle = BAD(); fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(117 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">80 ms per call, p50/p99, 12 req/s and the cost of 0.1 vCPU and 50 MB per proxy are example numbers from the module, in a realistic order of magnitude; 1 ms is the approximate cost of the 2 proxies.</li>';
  const DATA = {
    sem: () => `<li>Call: <b>POST /cobrancas</b> with <b>${BODY}</b></li><li>pedidos (Go): retry <b>5×, no wait</b> → 6 calls on a 503 · estoque (Java): <b>no TLS</b> · catalogo (Node.js): <b>no metrics</b></li><li>3 languages = 3 network libraries to maintain; changing a rule = changing 3 codebases.</li>${EX}`,
    sidecar: () => `<table class="h3-sum"><tr><th>what</th><th>with sidecar</th></tr><tr><td>proxies</td><td>30 Envoys (1 per pod)</td></tr><tr><td>in the path</td><td>2 per call · ~1 ms (80 → 81 ms)</td></tr><tr><td>identity</td><td>${SID('pedidos')}</td></tr><tr><td>cost</td><td>30 × 0.1 vCPU = <b>3 vCPU</b> · 30 × 50 MB = <b>1.5 GB</b></td></tr><tr><td>swapping Envoy</td><td>recreate the 30 pods</td></tr></table>
      <li>mTLS: <b>both sides</b> present a certificate (in the TLS of module 1, only the server). istiod issues and rotates them (example validity: 24 h).</li><li>Envoy metrics: <b>istio_requests_total</b>, <b>istio_request_duration_milliseconds</b>, per pair of services; spans with trace_id 7f3a…</li>${EX}`,
    regras: () => `<li><b>Canary</b>: 90 / 10 by weight; with <b>x-versao: v2</b>, always v2</li><li><b>Retry</b>: attempts 2, retryOn "503"; Envoy waits <b>25 ms</b> between attempts (its default); 81 + 25 + 81 = <b>187 ms</b>. Only because the charge for pedido_id 1048 is idempotent.</li><li><b>Timeout</b>: 2 s → <b>504</b> upstream request timeout</li><li><b>AuthorizationPolicy</b>: catalogo → POST /cobrancas = <b>403 RBAC: access denied</b></li><li><b>istiod down</b>: calls keep going with the last configuration; new rules do not arrive; certificates expire in 24 h without rotation.</li>${EX}`,
    falha: () => `<li><b>Abort</b>: 10% 503s, returned by the caller's Envoy (<b>fault filter abort</b>); recomendacoes never receives it</li><li><b>Delay</b>: 10% with 2 s; bff-app gives up at <b>100 ms</b> and answers with "recomendado": []</li><table class="h3-sum"><tr><th>retries</th><th>bff-app</th><th>pedidos</th><th>pagamentos</th></tr><tr><td>3 in every layer</td><td>3</td><td>9</td><td><b>27</b></td></tr><tr class="on"><td>last hop only</td><td>1</td><td>1</td><td><b>3</b></td></tr></table>${EX}`,
    ambient: () => `<table class="h3-sum"><tr><th></th><th>sidecar</th><th>ambient</th></tr><tr><td>where it lives</td><td>in the pod</td><td>on the node (ztunnel) + waypoint</td></tr><tr><td>how many</td><td>30</td><td>3 ztunnels + 1 waypoint</td></tr><tr class="on"><td>vCPU · memory</td><td>3 · 1.5 GB</td><td>0.4 · 200 MB</td></tr><tr><td>L4 (mTLS, identidade)</td><td>Envoy</td><td>ztunnel</td></tr><tr><td>L7 (retry, rota, RBAC)</td><td>Envoy</td><td>waypoint</td></tr></table>
      <li>The tunnel between ztunnels is <b>HBONE</b> (mTLS, port <b>15008</b>).</li><li>A rule with L7 (method, path) enforced by a ztunnel <b>becomes DENY</b>: it fails closed.</li><li class="h3-dim">In the example, a ztunnel and a waypoint each cost the same as a sidecar (0.1 vCPU · 50 MB).</li>`,
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
      <div class="i3-count" id="m3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one line</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'Active rule')}</b>${esc(s.yaml.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'mesh') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'mesh' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-mesh3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'mesh') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  const inRect = (b, p, m = 3) => p[0] > b.x - m && p[0] < b.x + b.w + m && p[1] > b.y - m && p[1] < b.y + b.d + m;
  let lastT = 0;
  function scene3(dt) {
    const o = SP = spec();
    // a peça acende quando a luz passa por ela
    NAMES.forEach(nm => { if (!o.on[nm] && o.show[nm] && o.dots.some(p => inRect(B[nm], p))) o.on[nm] = 1; });
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.y, PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.y + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && PROXY(nm) ? 0.9 : 0); });
    // cabos do istiod até os proxies visíveis
    const targets = NAMES.filter(n => PROXY(n) && o.show[n] && B[n].f > 0.95), beams = o.beams.slice();
    if (o.cab && o.show.ist) targets.forEach((n, i) => { const pts = cable(n), pt = o.cabT.find(q => q[0] === n);
      if (o.cab === 'bad') beams.push({ pts, thin: true, on: true, tone: 'bad', cut: 0.3 });
      else beams.push({ pts, thin: true, on: !!pt && pt[1] > 0 && pt[1] < 1, dot: pt && pt[1] > 0 && pt[1] < 1 ? pt[1] : null }); });
    setBeams(beams); drawScreen(o); drawNodes();
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    if (o.lena) LENA.set('Lena · Recife', 'dim').at(-52, 392, 6); else LENA.hide();
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 46); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('m3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-60, 815, 8, 425];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.8 : nar ? 0.99 : 0.97 - side, aH = POSTER ? 0.7 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.05 / (2 * tn * aH));
      const fx = POSTER ? 0.46 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.41 : nar ? 0.07 + aH * 0.6 : 0.52;
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
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...NODE, scr];
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
    view: NARROW() ? { target: W(400, 220, -150), dist: innerWidth < 640 ? 14 : 17 } : { target: W(150, 220, 60), dist: 15.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
