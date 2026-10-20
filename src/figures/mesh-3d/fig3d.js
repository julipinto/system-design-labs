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
  const dec = v => String(+v.toFixed(2)).replace('.', ',');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['sem', 'sidecar', 'regras', 'falha', 'ambient'];
  const SCNAME = { sem: 'Sem malha', sidecar: 'Sidecar', regras: 'Regras', falha: 'Falha', ambient: 'Ambient' };
  const SCFULL = { sem: 'Sem malha: cada app do seu jeito', sidecar: 'Sidecar: um Envoy em cada pod', regras: 'Regras: o control plane empurra',
    falha: 'Fault injection e tempestade de retries', ambient: 'Ambient: ztunnel por nó e waypoint' };
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
    cat: [['métrica: nenhuma', 'bad'], ['retry: 3× (lib Node.js)']], est: [['TLS: nenhum', 'bad'], ['retry: nenhum']],
    rec: [['quem comprou também', 'dim'], ['comprou (módulo 9)', 'dim']], bff: [['timeout 100 ms', 'dim'], ['fallback (módulo 9)', 'dim']],
    ped: [['retry: 5× sem espera', 'bad'], ['TLS: lib Go']], pag: [['TLS: lib Java'], ['métrica: própria', 'dim']],
  };
  const MESHED = [['código: só o negócio', 'dim'], ['rede: fora do app', 'dim']];
  const appRows = (k, ...l) => ({ name: pod(k).nm, lang: pod(k).lang, rows: l.length ? l : sc === 'sem' ? OWN[k] : MESHED });
  const sideRows = (st, tone = 'dim') => ({ name: 'ENVOY', lang: 'sidecar', rows: [[st, tone]] });
  const ztRows = (c, st = 'L4 · mTLS', tone = 'dim') => ({ name: 'ZTUNNEL', lang: 'nó ' + (c + 1), rows: [[st, tone]] });
  const wpRows = (st = 'L7 · ns loja', tone = 'dim', st2 = 'retry · rota · RBAC') => ({ name: 'WAYPOINT', lang: '', rows: [[st, tone], [st2, 'dim']] });
  const istRows = (...extra) => ({ name: 'ISTIOD', lang: 'control plane', rows: extra.length ? extra : [['VirtualService · DestinationRule', 'dim'], ['AuthorizationPolicy', 'dim'], ['PeerAuthentication', 'dim'], ['certificados · 24 h', 'dim']] });

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
      { id: 'cobra', dur: 5, title: 'O pedidos cobra o pedido 1048', yk: 'NO CÓDIGO · pedidos (Go)',
        yaml: ['// pedidos (Go): cada time faz o seu', 'body := `' + BODY + '`', 'res, err := tlsClient.Post(', '  "https://pagamentos:8443/cobrancas",', '  "application/json", body)', '// TLS montado à mão: lib Go aqui,', '// lib Java do outro lado'],
        ys: ['res, err := tlsClient.Post(', '  ".../cobrancas", "application/json",', '  `{"pedido_id":1048,"valor":94.90}`)', '// TLS montado à mão no código'],
        story: 'A Lena fechou o pedido 1048, de 94.90, e o bff-app já mostrou a tela dela. Agora o pedidos precisa cobrar: manda um POST com o pedido e o valor para o pagamentos. São 6 serviços conversando assim dentro da loja, cada um num pod do Kubernetes, e por enquanto não existe malha nenhuma: quem decide como a chamada viaja é o código de cada app.',
        look: 'A luz sai do pedidos, corre no corredor do meio e entra no pagamentos, que responde 201 em 80 ms.',
        key: 'Sem malha, retry, TLS e métrica são linhas de código dentro de cada serviço.',
        f(o, t) { let ms = 0;
          if (t > 0.3) ms = Math.min(80, (t - 0.3) / 2.6 * 80);
          send(o, t, 0.3, 1.5, PEDPAG, 'POST /cobrancas\n' + BODY, 'hi');
          if (send(o, t, 1.9, 2.9, rev(PEDPAG), '201 Created · 80 ms', 'acc')) { o.res = ['201 Created · 80 ms', '{"pedido_id":1048,"status":"aprovada"}']; ms = 80; }
          o.cnt = C3(['CHAMADAS AO PAGAMENTOS', t > 1.5 ? '1' : '0'], ['TEMPO DA CHAMADA', Math.round(ms) + ' ms'], ['QUEM DECIDE A REGRA', 'o código do app', 'dim']);
          if (t > 3.1) T(o, 'pag', 'cobrança do 1048\n201 · 80 ms'); } },
      { id: 'times', dur: 6.5, title: 'Cada time escreveu do seu jeito', yk: 'NO CÓDIGO · 3 linguagens',
        yaml: ['# pedidos (Go):      retry 5×, sem espera', '# estoque (Java):    HTTP sem TLS', '# catalogo (Node.js): não mede nada', '# 3 linguagens = 3 bibliotecas de rede', '# mudar a regra = mudar 3 códigos'],
        story: 'Abra o código dos serviços e cada um resolveu a rede de um jeito. O pedidos, em Go, tenta de novo 5 vezes sem esperar. O estoque, em Java, fala HTTP sem TLS. O catalogo, em Node.js, não mede latência nem erro. Três linguagens, três bibliotecas, e nenhuma regra igual para todos.',
        look: 'Os pods acendem um por vez: o pedidos, o estoque e o catalogo, cada um com a linha do próprio código em vermelho.',
        key: 'Cada time reinventa retry, TLS e métrica, e cada um reinventa diferente.',
        f(o, t) { o.cnt = C3(['LINGUAGENS', 'Go · Node.js · Java'], ['BIBLIOTECAS DE REDE', '3 (uma por linguagem)'], ['REGRAS IGUAIS PARA TODOS', '0', 'bad']);
          const k = t < 2 ? 'ped' : t < 3.8 ? 'est' : 'cat';
          if (t > 0.3) { o.on[k] = 1; T(o, k, { ped: 'Go: retry 5× sem espera', est: 'Java: HTTP sem TLS', cat: 'Node.js: sem métrica' }[k], 'bad'); }
          if (t > 5.4) { o.on.ped = o.on.est = o.on.cat = 2; o.tags.length = 0; T(o, 'est', '3 linguagens\n3 jeitos de fazer rede', 'bad'); }
          o.res = ['cada mudança: 3 PRs, 3 deploys']; } },
      { id: 'aberto', dur: 5.5, title: 'O estoque conversa em texto aberto', yk: 'NO CÓDIGO · estoque (Java)',
        yaml: ['// estoque (Java): servidor HTTP puro', 'server.port=8080   # sem TLS', '// o pedidos chama:', 'POST http://estoque:8080/reservas', '{"pedido_id":1048,"produto_id":42}'],
        story: 'Pago o 1048, o pedidos reserva o gato de pelúcia no estoque. Só que o estoque nunca ligou TLS: o JSON da reserva atravessa a rede do cluster como texto. Qualquer processo que enxergue esse caminho lê o pedido, o produto e quem chamou.',
        look: 'A luz vai do pedidos ao estoque, atrás dele, com o JSON legível no balão vermelho.',
        key: 'Um serviço sem TLS deixa aberta a conversa de todos os que falam com ele.',
        f(o, t) { o.cnt = C3(['CHAMADAS CIFRADAS', t > 1.6 ? '1 de 2' : '1 de 1', t > 1.6 ? 'bad' : ''], ['pedidos → estoque', t > 1.6 ? 'texto aberto' : '…', 'bad'], ['QUEM PROVA QUEM É', 'ninguém', 'bad']);
          send(o, t, 0.3, 1.6, PEDEST, 'POST /reservas\n{"pedido_id":1048,"produto_id":42}', 'bad');
          if (send(o, t, 2.0, 2.9, rev(PEDEST), '201 · reservado', 'hi')) o.res = ['201 Created', '(trafegou sem cifra)'];
          if (t > 1.4) T(o, [CX(1) - 40, 280, 8], 'texto aberto: quem estiver\nno caminho lê o JSON', 'bad'); } },
      { id: 'cego', dur: 5, title: 'O catalogo não mede nada', yk: 'NO CÓDIGO · catalogo (Node.js)',
        yaml: ["app.get('/produtos/:id', async (req, res) => {", '  res.json(await db.produto(req.params.id))', '})', '// nenhum contador, nenhum histograma,', '// nenhum span de tracing'],
        story: 'O bff-app pede o produto 42 ao catalogo para montar a tela da Lena. A resposta volta, mas quanto tempo levou? Quantas deram erro hoje? O catalogo não registra nada, então ninguém sabe se ele está lento até alguém reclamar.',
        look: 'A luz vai do bff-app ao catalogo e volta; no mostrador, a latência e a taxa de erro do catalogo ficam vazias.',
        key: 'Sem métrica igual em todos, o problema aparece primeiro na reclamação do cliente.',
        f(o, t) { o.cnt = C3(['LATÊNCIA DO CATALOGO', '— sem dado', 'bad'], ['TAXA DE ERRO', '— sem dado', 'bad'], ['SPANS DE TRACING', '0', 'bad']);
          send(o, t, 0.3, 1.3, BFFCAT, 'GET /produtos/42', 'hi');
          if (send(o, t, 1.6, 2.6, rev(BFFCAT), '200 · gato de pelúcia', 'acc')) o.res = ['200 OK', 'quanto tempo? ninguém mediu'];
          if (t > 2.9) T(o, 'cat', 'lento ou quebrado?\nninguém sabe', 'bad'); } },
      { id: 'insiste', dur: 7, title: 'E se der errado: 5 retries sem espera', yk: 'NO CÓDIGO · pedidos (Go)',
        yaml: ['for i := 0; i <= 5; i++ {', '  res, err = tlsClient.Post(url, ct, body)', '  if err == nil && res.StatusCode != 503 {', '    break', '  }', '}   // nenhuma pausa entre as tentativas'],
        story: 'O pagamentos fica sobrecarregado e responde 503 à cobrança do 1048. O código do pedidos tenta de novo na hora, 5 vezes, sem esperar nada. São 6 chamadas em sequência em cima de quem já estava caindo, e cada outro pedido da loja faz o mesmo.',
        look: 'O pagamentos fica vermelho; a luz vai e volta 6 vezes seguidas e o contador sobe até 6.',
        key: 'Retry sem espera nem limite piora a falha que ele queria contornar.',
        f(o, t) { o.on.pag = 'bad'; o.rows.pag = appRows('pag', ['503 · sobrecarregado', 'bad'], ['TLS: lib Java']);
          let n = 0; for (let i = 0; i < 6; i++) { const a = 0.4 + i * 0.75; if (t > a) n = i + 1;
            if (t > a && t < a + 0.75) { send(o, t, a, a + 0.35, PEDPAG, i ? `retry ${i}` : 'POST /cobrancas', 'hi', 0); send(o, t, a + 0.38, a + 0.7, rev(PEDPAG), '503', 'bad', 0); } }
          if (t > 5) quiet(o, PEDPAG);
          o.cnt = C3(['CHAMADAS AO PAGAMENTOS', String(n), n > 1 ? 'bad' : ''], ['ESPERA ENTRE ELAS', '0 ms', 'bad'], ['RESULTADO', n ? '503' : '…', 'bad']);
          o.res = n ? [`tentativa ${n}: 503 Service Unavailable`] : [];
          if (t > 5) { T(o, 'pag', '6 chamadas seguidas\nsem pausa nenhuma', 'bad'); T(o, 'ped', 'o 1048 continua sem cobrança', 'bad'); } } },
    ],
    sidecar: [
      { id: 'injeta', dur: 5.5, title: 'Um Envoy entra em cada pod', yk: 'COMANDO',
        yaml: ['kubectl label namespace loja \\', '  istio-injection=enabled', '# cada pod nasce com 2 contêineres:', '#   o app + o istio-proxy (Envoy)', '# iptables desvia a entrada e a saída', '#   do pod para o Envoy'],
        story: 'A ideia da malha é tirar a rede do código. Ligamos o Istio no namespace loja e cada pod passa a nascer com um segundo contêiner, o Envoy, colado ao app. Regras de iptables mandam todo o tráfego que entra e sai do pod pelo Envoy, e o app nem percebe. São 30 pods na loja, então são 30 Envoys.',
        look: 'Uma caixa ENVOY sobe na beira de cada pod, do lado do corredor; cabos finos ligam cada uma ao istiod lá atrás.',
        key: 'Sidecar: um proxy dentro de cada pod, no caminho de tudo o que entra e sai.',
        f(o, t) { const up = t > 0.4; PK.forEach(k => o.show['s' + k] = up ? 1 : 0); o.cab = t > 1.6 ? 'idle' : null;
          const n = Math.round(clamp((t - 0.4) / 1.4) * 30);
          o.cnt = C3(['PODS NA LOJA', '30'], ['SIDECARS (ENVOY)', String(n)], ['LINHAS MUDADAS NO APP', '0']);
          o.res = n ? [`${n} de 30 pods com app + Envoy`] : [];
          if (t > 2.2) { T(o, 'sped', 'Envoy do pedidos'); T(o, 'spag', 'Envoy do pagamentos'); } } },
      { id: 'caminho', dur: 6, title: 'A chamada passa por 2 proxies', yk: 'NO CÓDIGO · pedidos (Go)',
        yaml: ['// o app voltou a ser simples:', 'http.Post("http://pagamentos:8080/cobrancas",', '  "application/json", body)', '// sem TLS, sem retry no código:', '// isso agora é do Envoy'],
        story: 'O pedidos volta a chamar o endereço simples, http://pagamentos:8080/cobrancas. A chamada sai do app, cai no Envoy do pedidos, atravessa a rede até o Envoy do pagamentos e só então chega ao app do pagamentos. Dois proxies no caminho custam perto de 1 ms: a cobrança leva 81 ms em vez de 80.',
        look: 'A luz acende o Envoy do pedidos, corre no corredor, acende o Envoy do pagamentos e entra no app.',
        key: 'Com sidecar, toda chamada atravessa 2 proxies: o de quem chama e o de quem recebe.',
        f(o, t) { let ms = 0; if (t > 0.3) ms = Math.min(81, (t - 0.3) / 2.7 * 81);
          send(o, t, 0.3, 1.8, PEDPAG, 'POST /cobrancas\n' + BODY, 'hi');
          if (send(o, t, 2.1, 3.0, rev(PEDPAG), '201 · 81 ms', 'acc')) { o.res = ['201 Created · 81 ms', '(80 do app + ~1 dos 2 Envoys)']; ms = 81; }
          o.cnt = C3(['PROXIES NO CAMINHO', '2'], ['TEMPO DA CHAMADA', Math.round(ms) + ' ms'], ['CUSTO DOS 2 ENVOYS', '~1 ms']);
          if (t > 0.6 && t < 2.4) T(o, 'sped', '1º proxy: saída do pedidos');
          if (t > 1.3 && t < 3.2) T(o, 'spag', '2º proxy: entrada do pagamentos');
          if (t > 3.2) T(o, 'pag', '201 · 81 ms (+1 ms)'); } },
      { id: 'mtls', dur: 6.5, title: 'mTLS: os dois lados provam quem são', yk: 'REGRA ATIVA · PeerAuthentication', yaml: PA,
        story: 'Entre os dois Envoys a conversa agora é cifrada com mTLS. No TLS do módulo 1, só o servidor mostrava certificado; aqui os dois lados mostram. O do pedidos diz spiffe://loja.local/ns/loja/sa/pedidos e o do pagamentos diz o dele. O istiod emite esses certificados e troca cada um antes de vencer (24 h no exemplo). Até o estoque, que nunca ligou TLS, passa a falar cifrado.',
        look: 'Os dois Envoys mostram a identidade SPIFFE de cada lado; a luz entre eles vira "mTLS · cifrado", e a do estoque também.',
        key: 'mTLS: cifra a conversa e cada lado prova a sua identidade com certificado.',
        f(o, t) { PK.forEach(k => o.rows['s' + k] = sideRows(t > 0.6 ? 'mTLS · sa/' + pod(k).nm : 'sidecar · proxy', t > 0.6 ? 'acc' : 'dim'));
          send(o, t, 0.3, 1.6, PEDPAG, 'mTLS · cifrado', 'acc');
          if (t > 0.5 && t < 3.6) { T(o, [CX(1) - 130, 288, 8], 'pedidos mostra:\n' + SID('pedidos'), 'acc'); T(o, 'spag', 'pagamentos mostra:\n' + SID('pagamentos'), 'acc'); }
          if (send(o, t, 1.9, 2.6, rev(PEDPAG), '201 · cifrado', 'acc')) o.res = ['handshake mTLS ok · 201 Created'];
          send(o, t, 3.6, 4.6, PEDEST, 'mTLS · cifrado', 'acc'); if (send(o, t, 4.8, 5.4, rev(PEDEST), '201', 'acc', 0.3)) o.res = ['pedidos → estoque: cifrado também', '(o código do estoque não mudou)'];
          o.cnt = C3(['CHAMADAS CIFRADAS', t > 4.6 ? '2 de 2' : '1 de 1'], ['CERTIFICADOS', '2 lados · 24 h'], ['QUEM EMITE', 'istiod']);
          if (t > 4.6) T(o, 'sest', 'estoque: cifrado sem\nmudar uma linha', 'acc'); } },
      { id: 'metricas', dur: 6.5, title: 'Métricas de graça, até no catalogo', yk: 'MÉTRICA GERADA PELO ENVOY',
        yaml: ['istio_requests_total{', '  source_workload="pedidos",', '  destination_workload="pagamentos",', '  response_code="201"}', 'istio_request_duration_milliseconds', '# span: trace_id=7f3a… em cada salto'],
        story: 'Como toda chamada passa por um Envoy, cada Envoy conta: latência, erros e vazão de cada par de serviços, no mesmo formato para todos. O catalogo, que não media nada, ganha números sem mudar uma linha. E cada salto vira um span com o trace_id 7f3a… do módulo 6, ligando o pedido inteiro.',
        look: 'Duas chamadas correm ao mesmo tempo; o mostrador ganha p50 e p99 dos dois pares, inclusive o do catalogo.',
        key: 'Telemetria vem do proxy, não do app: igual para todos os serviços.',
        f(o, t) { send(o, t, 0.3, 1.5, PEDPAG, 'POST /cobrancas', 'hi', 0.2); send(o, t, 1.8, 2.6, rev(PEDPAG), '201 · 81 ms', 'acc', 0.3);
          send(o, t, 0.6, 1.6, BFFCAT, 'GET /produtos/42', 'hi', 0.2); send(o, t, 1.9, 2.7, rev(BFFCAT), '200 · 12 ms', 'acc', 0.3);
          const on = t > 2.8;
          o.cnt = C3(['pedidos → pagamentos', on ? 'p50 81 · p99 140 ms' : '…'], ['bff-app → catalogo', on ? 'p50 12 · p99 45 ms' : '…'], ['ERROS · VAZÃO', on ? '0,1% · 12 req/s | 0% · 300' : '…']);
          o.res = on ? ['trace_id=7f3a… · 1 span por salto', '(gerado pelos Envoys)'] : [];
          if (t > 3) T(o, 'scat', 'agora o catalogo tem\np50, p99, erros e vazão', 'acc'); } },
      { id: 'custo', dur: 7.5, title: 'E se der errado: trocar o Envoy dos 30 pods', yk: 'COMANDO',
        yaml: ['# saiu uma correção de segurança', '#   no Envoy: o sidecar só troca', '#   quando o pod renasce', 'kubectl rollout restart deployment -n loja', '# 30 pods × (0,1 vCPU + 50 MB)', '#   = 3 vCPU e 1,5 GB só de proxy'],
        story: 'Sai uma correção de segurança no Envoy. Como ele mora dentro de cada pod, a única forma de trocar é recriar os pods: os 30, um a um, com o app junto. E a conta fica: 0,1 vCPU e 50 MB por sidecar vezes 30 pods dão 3 vCPU e 1,5 GB só de proxy, mais ~1 ms em cada chamada.',
        look: 'Os Envoys afundam e voltam um de cada vez; o contador de pods reiniciados sobe até 30.',
        key: 'O preço do sidecar: um proxy por pod para pagar em CPU, memória e reinícios.',
        f(o, t) { const n = Math.min(30, Math.floor(clamp((t - 0.4) / 5) * 30 + (t > 0.4 ? 1 : 0)));
          PK.forEach((k, i) => { const ph = (t - 0.4 - i * 0.8); if (ph > 0 && ph < 0.7) { o.show['s' + k] = 0; } if (ph > 0 && ph < 1.4) o.on['s' + k] = 'bad'; });
          o.cnt = C3(['PODS REINICIADOS', `${n} de 30`, n < 30 ? 'bad' : ''], ['CUSTO DOS SIDECARS', '3 vCPU · 1,5 GB'], ['LATÊNCIA EXTRA', '~1 ms por chamada']);
          o.res = n < 30 ? ['recriando pods: app + Envoy novo'] : ['30 pods recriados para trocar o proxy'];
          if (t > 5.8) T(o, 'sped', 'trocar o proxy = reiniciar\no app junto, 30 vezes', 'bad'); } },
    ],
    regras: [
      { id: 'istiod', dur: 6, title: 'O istiod guarda as regras e empurra', yk: 'COMANDO',
        yaml: ['kubectl apply -f regras.yaml', '# o istiod guarda e empurra via xDS:', 'VirtualService       rota, retry, timeout', 'DestinationRule      balanceamento, v1/v2', 'AuthorizationPolicy  quem chama quem', 'PeerAuthentication   mTLS STRICT'],
        story: 'Os Envoys estão no caminho, mas quem diz o que eles fazem? O control plane. No Istio ele se chama istiod: guarda as regras, escritas em YAML, e o certificado de cada serviço, e empurra tudo para os 30 proxies pela API xDS do Envoy. Os Envoys formam o data plane, que executa.',
        look: 'O istiod acende e um ponto de luz desce por cada cabo até um Envoy; cada um acende quando recebe.',
        key: 'Control plane decide e distribui; data plane (os proxies) executa em cada chamada.',
        f(o, t) { o.on.ist = t > 0.3 && t < 3 ? 1 : 2; const sides = PK.map(k => 's' + k);
          if (t > 0.8) push(o, t, 0.8, 2.2, sides);
          const n = t > 2.2 ? 30 : Math.round(clamp((t - 0.8) / 1.4) * 30); if (t > 2.2) sides.forEach(s => { o.on[s] = 2; o.rows[s] = sideRows('config v1 · xDS', 'acc'); });
          o.cnt = C3(['REGRAS NO ISTIOD', '4 tipos'], ['PROXIES CONFIGURADOS', `${n} de 30`], ['CERTIFICADOS', '1 por serviço · 24 h']);
          o.res = t > 2.2 ? ['30 Envoys com a mesma configuração'] : [];
          if (t > 2.6) T(o, 'ist', 'control plane: decide', 'acc'); if (t > 2.8) T(o, 'sped', 'data plane: executa', 'acc'); } },
      { id: 'canary', dur: 7.5, title: 'Canary: 10% das chamadas no pedidos v2', yk: 'REGRA ATIVA · VirtualService', yaml: VS_PED,
        ys: ['kind: VirtualService  # pedidos', '- match: x-versao: v2 → subset v2', '- route:', '    v1  weight: 90', '    v2  weight: 10'],
        story: 'O time de checkout lançou o pedidos v2 e quer testar com pouca gente. A regra no istiod manda 90% das chamadas para o v1 e 10% para o v2, por peso. Das 10 chamadas do bff-app, 1 cai no v2. E quem manda o cabeçalho x-versao: v2 vai sempre para o v2.',
        look: 'Dez luzes vão do bff-app ao pedidos; a 7ª acende como v2. A última, com o cabeçalho, também vai ao v2.',
        key: 'Canary: uma fatia pequena do tráfego na versão nova, decidida na malha.',
        f(o, t) { let n1 = 0, n2 = 0;
          for (let i = 0; i < 10; i++) { const a = 0.3 + i * 0.5; if (t > a + 0.4) { if (i === 6) n2++; else n1++; } if (t > a && t < a + 0.5) send(o, t, a, a + 0.4, BFFPED, i === 6 ? 'v2' : '', i === 6 ? 'acc' : 'hi', 0.1); }
          if (t > 5.6) { send(o, t, 5.6, 6.3, BFFPED, 'x-versao: v2', 'acc', 0.4); if (t > 6.3) n2++; }
          if (t > 6.5 || t < 0.3) quiet(o, BFFPED);
          o.rows.ped = appRows('ped', [`v1: ${n1} chamadas`, ''], [`v2: ${n2} chamada${n2 === 1 ? '' : 's'}`, n2 ? 'acc' : 'dim']);
          o.cnt = C3(['pedidos v1', String(n1)], ['pedidos v2', String(n2)], ['PESO', '90 / 10']);
          o.res = t > 6.3 ? ['x-versao: v2 → sempre v2'] : n1 + n2 ? [`${n1 + n2} chamadas: ${n1} v1, ${n2} v2`] : [];
          if (t > 5.4) T(o, 'ped', '10 chamadas: 9 no v1, 1 no v2', 'acc'); } },
      { id: 'retry', dur: 6.5, title: 'Retry: até 2 vezes, só em 503', yk: 'REGRA ATIVA · VirtualService', yaml: VS_PAG,
        ys: ['kind: VirtualService  # pagamentos', 'timeout: 2s', 'retries:', '  attempts: 2', '  retryOn: "503"', '# espera do Envoy entre tentativas: 25 ms'],
        story: 'O pagamentos responde 503 uma vez à cobrança do 1048. Quem tenta de novo agora é o Envoy do pedidos, com regra: no máximo 2 vezes, só para 503, esperando 25 ms entre as tentativas. A segunda passa. O app do pedidos só vê o 201, em 187 ms (81 + 25 + 81). Só dá para repetir porque cobrar o mesmo pedido_id 1048 duas vezes não gera duas cobranças.',
        look: 'A primeira luz volta vermelha só até o Envoy do pedidos, que espera e manda de novo; a segunda volta laranja até o app.',
        key: 'Retry na malha: com limite, espera, só para erros que valem repetir e só em operação idempotente.',
        f(o, t) { let n = 0, ms = 0; const half = route('ped', 'pag', 40, -40);
          if (send(o, t, 0.3, 1.3, half, 'POST /cobrancas', 'hi', 0.1)) n = 1; if (t > 0.3) ms = Math.min(81, (t - 0.3) / 1.6 * 81);
          if (t > 0.3) n = 1; if (t > 1.3 && t < 2.2) o.on.pag = 'bad';
          if (send(o, t, 1.5, 2.2, rev(half).slice(0, 3).concat([[CX(1) + 40, EDGE[1] - 4, Z]]), '503 · tentativa 1', 'bad', 0.1)) { o.on.sped = 1; }
          if (t > 2.2) ms = 81 + Math.min(25, (t - 2.2) / 0.5 * 25);
          if (t > 2.7) { n = 2; ms = 106 + Math.min(81, (t - 2.7) / 1.4 * 81); }
          send(o, t, 2.7, 3.5, half, 'retry após 25 ms', 'acc', 0.1);
          if (send(o, t, 3.6, 4.2, rev(half), '201 · 187 ms', 'acc')) { ms = 187; o.res = ['tentativa 1: 503 · tentativa 2: 201', 'o app vê só o 201 · 187 ms']; }
          o.cnt = C3(['TENTATIVAS', `${n} de no máximo 3`], ['TEMPO TOTAL', Math.round(ms) + ' ms'], ['O APP DO PEDIDOS VÊ', t > 4.2 ? '201' : '…']);
          if (t > 2.1 && t < 2.8) T(o, 'sped', 'Envoy: 503, espera 25 ms', 'bad');
          if (t > 4.4) T(o, 'ped', '81 + 25 + 81 = 187 ms\no app não viu o 503'); } },
      { id: 'timeout', dur: 6, title: 'Timeout: 2 s e o Envoy corta', yk: 'REGRA ATIVA · VirtualService', yaml: VS_PAG,
        ys: ['kind: VirtualService  # pagamentos', 'http:', '- timeout: 2s', '  route:', '  - destination: { host: pagamentos }'],
        story: 'Agora o pagamentos não cai, ele trava: recebe a cobrança e não responde. Sem limite, o pedidos ficaria esperando com a conexão presa. Com timeout de 2 s na regra, o Envoy do pedidos corta a espera e devolve 504 ao app, que pode avisar a Lena ou tentar mais tarde.',
        look: 'A luz chega ao pagamentos e para; o relógio do mostrador corre até 2.000 ms e a resposta volta vermelha do Envoy.',
        key: 'Timeout na malha: ninguém espera mais do que a regra deixa.',
        f(o, t) { const run = clamp((t - 1.1) / 2.6); let ms = t > 1.1 ? Math.round(run * 2000) : 0;
          send(o, t, 0.3, 1.1, PEDPAG, 'POST /cobrancas', 'hi', 3);
          if (t > 1.1) { o.on.pag = 'bad'; o.rows.pag = appRows('pag', ['travado: não responde', 'bad'], [`${ms} ms…`, 'bad']); }
          if (send(o, t, 3.7, 4.4, rev(route('ped', 'pag', 40, -40)).slice(0, 2).concat([[CX(2) - 40, LY, Z], [CX(1) + 40, LY, Z], edge('ped', 40)]), '504 · upstream request timeout', 'bad')) o.res = ['504 Gateway Timeout', 'upstream request timeout'];
          if (t > 3.7) ms = 2000;
          o.cnt = C3(['ESPERANDO HÁ', `${ms} ms`, ms >= 2000 ? 'bad' : ''], ['LIMITE DA REGRA', '2 s'], ['RESPOSTA', t > 4.4 ? '504' : '…', 'bad']);
          if (t > 4.5) T(o, 'sped', 'Envoy cortou em 2 s', 'bad'); } },
      { id: 'authz', dur: 7, title: 'Só o pedidos pode cobrar: o catalogo leva 403', yk: 'REGRA ATIVA · AuthorizationPolicy', yaml: AP,
        ys: ['kind: AuthorizationPolicy', 'selector: app: pagamentos', 'action: ALLOW', 'from: loja.local/ns/loja/sa/pedidos', 'to: POST /cobrancas'],
        story: 'A política de autorização diz: no pagamentos, POST /cobrancas só para a identidade do pedidos. Quem confere é o Envoy do pagamentos, olhando o certificado de quem chama. O pedidos passa. O catalogo tenta o mesmo POST e leva 403 RBAC: access denied, sem nenhuma linha de código no pagamentos.',
        look: 'A luz do pedidos entra no pagamentos; a do catalogo para no Envoy do pagamentos, que fica vermelho e devolve 403.',
        key: 'Política de autorização: quem pode chamar o quê, conferido pela identidade no proxy.',
        f(o, t) { send(o, t, 0.3, 1.2, PEDPAG, 'POST /cobrancas', 'hi', 0.1); const ok = send(o, t, 1.4, 2.1, rev(PEDPAG), '201', 'acc', 0.2);
          const cut = CATPAG.slice(0, 3).concat([[CX(2) + 30, SIDEY[1] + 4, Z]]);
          send(o, t, 2.8, 4.0, cut, 'POST /cobrancas · sa/catalogo', 'bad', 0.1);
          const deny = t > 4.0; if (deny && t < 5.6) o.on.spag = 'bad';
          if (deny) o.rows.spag = sideRows('403 para sa/catalogo', 'bad');
          if (send(o, t, 4.3, 5.3, rev(cut), '403 RBAC: access denied', 'bad')) o.res = ['catalogo → 403', 'RBAC: access denied'];
          else if (ok) o.res = ['pedidos → 201 Created'];
          o.cnt = C3(['pedidos → POST /cobrancas', ok ? '201' : '…'], ['catalogo → POST /cobrancas', deny ? '403' : '…', 'bad'], ['LINHAS NO PAGAMENTOS', '0']);
          if (t > 4.2) T(o, 'spag', 'sa/catalogo não pode\nPOST /cobrancas → 403', 'bad'); } },
      { id: 'cai', dur: 7.5, title: 'E se der errado: o istiod cai', yk: 'COMANDO',
        yaml: ['# istiod fora do ar', 'kubectl apply -f canary-50.yaml', '# o Kubernetes guarda a regra nova,', '#   mas nenhum Envoy recebe', '# os Envoys seguem com a última', '#   configuração (canary 10%)'],
        story: 'O istiod cai. As chamadas param? Não: cada Envoy já tem a última configuração e continua executando. A cobrança do 1048 sai com 201 em 81 ms. O que para é a mudança: o time sobe o canary para 50% e nenhum proxy fica sabendo. Se o istiod passar das 24 h fora, os certificados vencem sem troca, e aí o mTLS para tudo.',
        look: 'O istiod fica vermelho e os cabos se cortam no meio; a luz entre pedidos e pagamentos continua correndo normal.',
        key: 'Sem control plane, o data plane segue com a última regra; só não chega regra nova.',
        f(o, t) { o.on.ist = 'bad'; o.rows.ist = istRows(['FORA DO AR', 'bad'], ['regra nova: canary 50%', 'dim'], ['não chega a ninguém', 'bad']); o.cab = 'bad';
          send(o, t, 0.6, 1.8, PEDPAG, 'POST /cobrancas', 'hi', 0.1); if (send(o, t, 2.0, 2.8, rev(PEDPAG), '201 · 81 ms', 'acc', 0.4)) o.res = ['201 Created · 81 ms', '(com a configuração de antes)'];
          o.cnt = C3(['CHAMADAS', 'seguem · 201'], ['REGRA NOVA (50%)', 'não chega', 'bad'], ['CERTIFICADOS', t > 4.6 ? 'vencem em 24 h' : 'valem até vencer', t > 4.6 ? 'bad' : '']);
          if (t > 0.4) T(o, 'ist', 'istiod caiu: nada novo\nchega aos proxies', 'bad');
          if (t > 3) T(o, 'pag', 'as chamadas continuam\ncom a última regra');
          if (t > 4.6) T(o, 'sped', 'fora por mais de 24 h:\ncertificado vence, mTLS para', 'bad'); } },
    ],
    falha: [
      { id: 'aborto', dur: 7, title: 'Fault injection: 10% de 503 no recomendacoes', yk: 'REGRA ATIVA · VirtualService', yaml: FAULT('abort'),
        ys: ['kind: VirtualService  # recomendacoes', 'fault:', '  abort:', '    percentage: { value: 10 }', '    httpStatus: 503'],
        story: 'O bff-app do módulo 9 tem fallback: se o recomendacoes falha, a tela sai sem "quem comprou também comprou". Mas funciona mesmo? A malha deixa testar sem quebrar nada de verdade: a regra manda o Envoy do bff-app devolver 503 em 10% das chamadas ao recomendacoes. Das 10, uma é cortada na saída e nem chega lá.',
        look: 'Dez luzes vão do bff-app ao recomendacoes; a 4ª para no próprio Envoy do bff-app, que fica vermelho.',
        key: 'Fault injection: a malha cria a falha de propósito para testar quem depende dela.',
        f(o, t) { let n = 0, got = 0, ab = 0;
          for (let i = 0; i < 10; i++) { const a = 0.3 + i * 0.5; if (t > a) n = i + 1;
            if (i === 3) { const p = [edge('bff', 60), [CX(0) + 60, SIDEY[1] + 6, Z]]; if (t > a && t < a + 1.2) { send(o, t, a, a + 0.25, p, '', 'bad', 0.9); o.on.sbff = 'bad'; } if (t > a + 0.25) ab = 1; }
            else { if (t > a + 0.4) got++; if (t > a && t < a + 0.5) send(o, t, a, a + 0.4, BFFREC, '', 'hi', 0.1); } }
          if (t > 5.4 || t < 0.3) quiet(o, BFFREC);
          o.rows.rec = appRows('rec', [`recebeu: ${got}`, ''], ['(a injetada não chega)', 'dim']);
          if (ab) o.rows.bff = appRows('bff', ['1 × 503 → fallback', 'acc'], ['"recomendado": []', 'acc']);
          o.cnt = C3(['CHAMADAS DO BFF-APP', `${n} de 10`], ['503 INJETADOS', String(ab), ab ? 'bad' : ''], ['A LENA VÊ', ab ? 'tela sem a seção' : 'tela completa']);
          o.res = ab ? ['503 · fault filter abort', 'bff-app: fallback, "recomendado": []'] : [];
          if (t > 2 && t < 4.5) T(o, 'sbff', 'o próprio Envoy devolve 503\n(fault filter abort)', 'bad');
          if (t > 5.6) T(o, 'bff', 'fallback funcionou\na Lena nem percebe'); } },
      { id: 'atraso', dur: 6.5, title: '2 s de atraso: o timeout do bff-app aguenta?', yk: 'REGRA ATIVA · VirtualService', yaml: FAULT('delay'),
        ys: ['kind: VirtualService  # recomendacoes', 'fault:', '  delay:', '    percentage: { value: 10 }', '    fixedDelay: 2s'],
        story: 'Agora a falha é lentidão: 10% das chamadas ao recomendacoes ganham 2 s de atraso. O bff-app espera no máximo 100 ms (o timeout do módulo 9). Na chamada atrasada, ele desiste aos 100 ms e responde a tela sem a seção; a resposta atrasada chegaria aos 2.000 ms, para ninguém.',
        look: 'A luz sai do bff-app e fica parada no Envoy dele; o relógio para em 100 ms e a tela sai sem esperar.',
        key: 'Atraso injetado mostra se os timeouts estão certos antes de um incidente real.',
        f(o, t) { const p = [edge('bff', 60), [CX(0) + 60, SIDEY[1] + 6, Z]]; send(o, t, 0.3, 0.6, p, 'atraso de 2 s', 'bad', 5);
          const ms = t < 0.6 ? 0 : Math.min(100, Math.round((t - 0.6) / 1.4 * 100)); if (t > 0.6) o.on.sbff = 1;
          if (t > 2.0) { o.on.bff = 1; o.rows.bff = appRows('bff', ['100 ms: desisti', 'acc'], ['"recomendado": []', 'acc']); }
          send(o, t, 2.2, 3.0, LENA_R.slice().reverse(), 'tela em ~100 ms, sem a seção', 'acc'); o.lena = true;
          const late = t > 4.2 ? 2000 : t > 2 ? 100 + Math.round((t - 2) / 2.2 * 1900) : ms;
          o.cnt = C3(['ATRASO INJETADO', '2 s'], ['TIMEOUT DO BFF-APP', '100 ms'], ['A RESPOSTA VIRIA EM', `${late} ms`, late > 100 ? 'bad' : '']);
          o.res = t > 2 ? ['bff-app: timeout aos 100 ms', 'tela sai sem "quem comprou também"'] : [`esperando: ${ms} ms`];
          if (t > 4.4) T(o, 'sbff', 'a resposta de 2.000 ms\nchegaria para ninguém', 'bad'); } },
      { id: 'tempestade', dur: 9, title: 'E se der errado: 1 clique, 27 chamadas', yk: 'RETRY EM 3 CAMADAS',
        yaml: ['# cada camada tenta 3 vezes:', 'app da Lena → bff-app:    3', 'bff-app → pedidos:        × 3', 'pedidos → pagamentos:     × 3', '# = 3 × 3 × 3 = 27 no pagamentos', '# e ele já estava caindo'],
        story: 'Agora o pagamentos cai de verdade e responde 503 a tudo. O app da Lena tenta 3 vezes o bff-app, o bff-app tenta 3 vezes o pedidos e o pedidos tenta 3 vezes o pagamentos. Cada camada multiplica a de cima: 3 × 3 × 3 = 27 chamadas no pagamentos por um clique só, justo quando ele precisava de folga para voltar.',
        look: 'A Lena toca uma vez; os contadores em cima dos pods sobem: 3 no bff-app, 9 no pedidos e 27 no pagamentos, em vermelho.',
        key: 'Tempestade de retries: tentativas em várias camadas se multiplicam.',
        f(o, t) { o.lena = true; o.on.pag = 'bad'; const f = clamp((t - 0.5) / 6.5);
          const c1 = Math.min(3, Math.ceil(f * 3)), c2 = Math.min(9, Math.ceil(f * 9)), c3 = Math.min(27, Math.ceil(f * 27));
          const pulse = (a, k) => { const ph = ((t - 0.5) * k) % 1; return ph; };
          if (t > 0.5 && t < 7) { o.beams.push({ pts: LENA_R, on: true, dot: pulse(0, 0.46), tone: 'bad' }, { pts: BFFPED, on: true, dot: pulse(0, 1.38), tone: 'bad' }, { pts: PEDPAG, on: true, dot: pulse(0, 4.15), tone: 'bad' });
            o.on.bff = 1; o.on.ped = 1; o.msgs.push([PEDPAG, 0.5, '503 · 503 · 503', 'bad']); }
          else quiet(o, LENA_R, BFFPED, PEDPAG);
          o.rows.bff = appRows('bff', [`recebeu: ${c1}`, c1 ? 'bad' : 'dim'], ['tenta 3× o pedidos', 'dim']);
          o.rows.ped = appRows('ped', [`recebeu: ${c2}`, c2 ? 'bad' : 'dim'], ['tenta 3× o pagamentos', 'dim']);
          o.rows.pag = appRows('pag', [`recebeu: ${c3}`, 'bad'], ['503 a tudo', 'bad']);
          o.cnt = C3(['bff-app recebe', String(c1)], ['pedidos recebe', String(c2)], ['pagamentos recebe', String(c3), 'bad']);
          o.res = [`${c1} × 3 = ${c2} · ${c2} × 3 = ${c3}`];
          if (t > 7) { T(o, 'pag', '27 chamadas\npor 1 clique da Lena', 'bad'); T(o, 'bff', '3 × 3 × 3 = 27', 'bad'); } } },
      { id: 'orcamento', dur: 7, title: 'A saída: repetir num lugar só', yk: 'REGRA ATIVA · VirtualService', yaml: VS_PAG,
        ys: ['# retry só no último salto, na malha:', 'kind: VirtualService  # pagamentos', 'retries: { attempts: 2, retryOn: "503" }', '# app da Lena e bff-app: sem retry', '# = 1 × 1 × 3 = 3 no pagamentos'],
        story: 'O conserto é decidir num lugar só quem repete. Os retries saem do código do app e do bff-app e ficam só na regra da malha, no salto pedidos → pagamentos: 1 tentativa e até 2 retries. O mesmo clique da Lena agora chega ao pagamentos 3 vezes, não 27. A malha também deixa pôr um orçamento de retry, um teto de repetições para o serviço inteiro.',
        look: 'A Lena toca de novo; os contadores param em 1, 1 e 3.',
        key: 'Retry com orçamento e num salto só: a conta fecha em 3 em vez de 27.',
        f(o, t) { o.lena = true; o.on.pag = 'bad';
          send(o, t, 0.4, 1.0, LENA_R, 'toque', 'hi', 0.2); send(o, t, 1.1, 1.8, BFFPED, '', 'hi', 0.2);
          let c3 = 0; for (let i = 0; i < 3; i++) { const a = 1.9 + i * 0.9; if (t > a + 0.4) c3 = i + 1; if (t > a && t < a + 0.9) { send(o, t, a, a + 0.4, PEDPAG, i ? `retry ${i} · 25 ms` : 'tentativa 1', 'hi', 0); send(o, t, a + 0.42, a + 0.8, rev(PEDPAG), '503', 'bad', 0); } }
          if (t > 4.6) quiet(o, PEDPAG);
          const c1 = t > 1.0 ? 1 : 0, c2 = t > 1.8 ? 1 : 0;
          o.rows.bff = appRows('bff', [`recebeu: ${c1}`, ''], ['sem retry próprio', 'dim']); o.rows.ped = appRows('ped', [`recebeu: ${c2}`, ''], ['retry: na malha', 'acc']);
          o.rows.pag = appRows('pag', [`recebeu: ${c3}`, c3 ? 'acc' : 'dim'], ['503 a tudo', 'bad']);
          o.cnt = C3(['bff-app recebe', String(c1)], ['pedidos recebe', String(c2)], ['pagamentos recebe', String(c3), 'acc']);
          o.res = c3 === 3 ? ['1 × 1 × 3 = 3 (antes: 27)', 'o pagamentos ganha folga para voltar'] : [];
          if (t > 5) T(o, 'pag', '3 chamadas, não 27'); } },
    ],
    ambient: [
      { id: 'antes', dur: 5, title: 'Antes: 30 sidecars, 3 vCPU e 1,5 GB', yk: 'CONTA DO SIDECAR',
        yaml: ['# 1 Envoy por pod:', '30 pods × 0,1 vCPU = 3 vCPU', '30 pods × 50 MB    = 1,5 GB', '# 2 proxies por chamada: ~1 ms', '# trocar o Envoy = recriar 30 pods'],
        story: 'Lembra da conta do sidecar? São 30 Envoys, um por pod, cada um com 0,1 vCPU e 50 MB: 3 vCPU e 1,5 GB só de proxy, e a loja roda em 3 nós. O modo ambient do Istio pergunta: e se o proxy morasse no nó, não no pod?',
        look: 'Os Envoys estão em todos os pods; a cobrança do 1048 passa pelos dois do caminho.',
        key: 'O custo do sidecar cresce com o número de pods, não com o de nós.',
        f(o, t) { PK.forEach(k => o.show['s' + k] = 1); o.show.z0 = o.show.z1 = o.show.z2 = 0;
          send(o, t, 0.3, 1.4, PEDPAG, 'POST /cobrancas', 'hi', 0.1); if (send(o, t, 1.6, 2.4, rev(PEDPAG), '201 · 81 ms', 'acc', 0.3)) o.res = ['201 · 2 sidecars no caminho'];
          o.cnt = C3(['PROXIES', '30 sidecars'], ['vCPU DE PROXY', '3'], ['MEMÓRIA DE PROXY', '1,5 GB']);
          if (t > 2.6) T(o, 'sped', 'cada um: 0,1 vCPU · 50 MB\n× 30 pods', 'bad'); } },
      { id: 'ztunnel', dur: 6.5, title: 'Os sidecars saem: um ztunnel por nó', yk: 'COMANDO',
        yaml: ['kubectl label namespace loja \\', '  istio.io/dataplane-mode=ambient', '# os pods voltam a ter só o app', '# 1 ztunnel por nó (DaemonSet):', '#   L4, mTLS e identidade', '# 3 nós → 3 ztunnels'],
        story: 'Mudamos o namespace para o modo ambient. Os Envoys saem dos pods e em cada nó entra um ztunnel, um proxy pequeno que cuida só da camada 4: mTLS e identidade. Com 3 nós, são 3 ztunnels em vez de 30 sidecars. No exemplo, cada ztunnel custa o mesmo que um sidecar: 0,3 vCPU e 150 MB no total.',
        look: 'As caixas ENVOY afundam nos pods e 3 caixas ZTUNNEL sobem no corredor, uma por nó.',
        key: 'Ambient: o proxy L4 sai do pod e vai para o nó, um por nó.',
        f(o, t) { const off = t > 0.5, on = t > 1.6; PK.forEach(k => o.show['s' + k] = off ? 0 : 1); [0, 1, 2].forEach(c => o.show['z' + c] = on ? 1 : 0); o.cab = t > 2.2 ? 'idle' : null;
          const k = clamp((t - 0.5) / 2.5), v = 3 - k * 2.7, mb = 1500 - k * 1350;
          o.cnt = C3(['PROXIES', on ? '3 ztunnels' : off ? '…' : '30 sidecars'], ['vCPU DE PROXY', dec(v)], ['MEMÓRIA DE PROXY', mb >= 1000 ? dec(mb / 1000) + ' GB' : Math.round(mb) + ' MB']);
          o.res = on ? ['pods com 1 contêiner só: o app'] : [];
          if (t > 3.4) { T(o, 'z1', '1 ztunnel por nó\n3 em vez de 30', 'acc'); } } },
      { id: 'l4', dur: 6, title: 'pedidos → pagamentos pelos ztunnels', yk: 'REGRA ATIVA · PeerAuthentication', yaml: PA,
        story: 'A cobrança do 1048 sai do pedidos e é capturada pelo ztunnel do nó 2, que abre um túnel mTLS (HBONE, porta 15008) até o ztunnel do nó 3, onde está o pagamentos. A identidade continua a mesma: spiffe://loja.local/ns/loja/sa/pedidos. Cifra e "quem é quem" seguem valendo, sem proxy nenhum dentro dos pods.',
        look: 'A luz acende o ztunnel do nó 2, corre no túnel e acende o ztunnel do nó 3 antes de entrar no pagamentos.',
        key: 'ztunnel: mTLS e identidade em L4, um proxy por nó.',
        f(o, t) { send(o, t, 0.3, 1.8, PEDPAG, 'mTLS (HBONE) · 15008', 'acc');
          if (send(o, t, 2.1, 3.0, rev(PEDPAG), '201', 'acc')) o.res = ['201 Created', 'túnel mTLS entre os nós 2 e 3'];
          o.cnt = C3(['PROXIES NO CAMINHO', '2 ztunnels'], ['IDENTIDADE', 'sa/pedidos → sa/pagamentos'], ['vCPU · MEMÓRIA', '0,3 · 150 MB']);
          if (t > 0.6 && t < 3.2) T(o, 'z1', 'sou ' + SID('pedidos'), 'acc');
          if (t > 3.2) T(o, 'z2', 'ztunnel lê L4: quem é,\npara onde vai. Não lê o HTTP', 'hi'); } },
      { id: 'waypoint', dur: 7.5, title: 'L7 precisa de um waypoint', yk: 'COMANDO',
        yaml: ['istioctl waypoint apply -n loja', 'kubectl label service pagamentos \\', '  istio.io/use-waypoint=waypoint', '# retry em 503, x-versao, POST /cobrancas:', '#   tudo isso é L7 e mora no waypoint', '# 1 waypoint: + 0,1 vCPU · 50 MB'],
        story: 'O retry em 503, o cabeçalho x-versao e o POST /cobrancas da política são coisas do HTTP, camada 7, que o ztunnel não lê. Para isso entra um waypoint: um Envoy por namespace (ou por serviço), só onde precisa. A cobrança passa a ir do ztunnel do nó 2 ao waypoint e de lá ao ztunnel do nó 3. O 503 do pagamentos volta a ter retry após 25 ms.',
        look: 'O WAYPOINT sobe na ponta do corredor; a luz faz o desvio por ele, volta vermelha uma vez e na segunda passa.',
        key: 'Waypoint: o Envoy de L7, um por namespace, só quando a regra precisa ler o HTTP.',
        f(o, t) { o.show.wp = t > 0.3 ? 1 : 0; let n = 0;
          if (send(o, t, 0.9, 2.3, PEDPAGW, 'POST /cobrancas', 'hi', 0.1)) n = 1; if (t > 0.9) n = 1;
          if (t > 2.3 && t < 3.0) { o.on.pag = 'bad'; o.on.wp = 'bad'; }
          const back = rev(PEDPAGW).slice(0, 5); send(o, t, 2.4, 3.0, back, '503', 'bad', 0.1);
          if (t > 3.1) o.on.wp = 1; if (t > 3.3) n = 2;
          send(o, t, 3.3, 4.0, PEDPAGW.slice(4), 'retry após 25 ms', 'acc', 0.1);
          if (send(o, t, 4.2, 5.4, rev(PEDPAGW), '201', 'acc')) o.res = ['503 → retry no waypoint → 201', 'o pedidos só vê o 201'];
          o.rows.wp = wpRows(t > 3.1 ? 'retry 2× · 503' : 'L7 · ns loja', t > 3.1 ? 'acc' : 'dim');
          o.cnt = C3(['PROXIES', '3 ztunnels + 1 waypoint'], ['vCPU · MEMÓRIA', '0,4 · 200 MB'], ['TENTATIVAS', n ? `${n}` : '…']);
          if (t > 5.4) T(o, 'wp', 'L7 só onde precisa\n0,4 vCPU no total (era 3)'); } },
      { id: 'semwp', dur: 7.5, title: 'E se der errado: regra L7 sem waypoint', yk: 'REGRA ATIVA · AuthorizationPolicy', yaml: AP,
        ys: ['kind: AuthorizationPolicy  # pagamentos', 'from: loja.local/ns/loja/sa/pedidos', 'to: POST /cobrancas   ← L7', '# sem waypoint, quem aplica é o ztunnel', '# ele não lê HTTP: a regra vira DENY'],
        story: 'Volte para antes do waypoint, com a política "só o pedidos faz POST /cobrancas" já aplicada. Quem recebe a chamada é o ztunnel do nó 3, e ele não enxerga método nem caminho. Em vez de deixar passar errado, o Istio faz a regra falhar fechada: vira DENY. Até a cobrança do pedidos, que devia passar, é recusada.',
        look: 'O waypoint some; a luz do pedidos chega ao ztunnel do nó 3, que fica vermelho e devolve a recusa.',
        key: 'Regra de L7 precisa de um proxy de L7; sem waypoint, o ztunnel nega por segurança.',
        f(o, t) { const cut = PEDPAG.slice(0, 3).concat([[CX(2) - 40, ZTY + ZTD + 2, Z]]);
          send(o, t, 0.4, 1.8, cut, 'POST /cobrancas · sa/pedidos', 'hi', 0.1);
          const deny = t > 1.8; if (deny) { o.on.z2 = 'bad'; o.rows.z2 = ztRows(2, 'regra L7 → DENY', 'bad'); }
          if (send(o, t, 2.1, 3.3, rev(cut), 'conexão recusada', 'bad')) o.res = ['conexão recusada pelo ztunnel', 'o 1048 não foi cobrado'];
          o.cnt = C3(['pedidos → pagamentos', deny ? 'recusada' : '…', 'bad'], ['A REGRA PEDE', 'POST /cobrancas (L7)'], ['O ZTUNNEL VÊ', 'só L4 → nega', 'bad']);
          if (t > 3.4) T(o, 'z2', 'não leio HTTP: na dúvida,\nnego (até o pedidos)', 'bad');
          if (t > 4.6) T(o, 'pag', 'conserto: o waypoint\ndo passo anterior', 'acc'); } },
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
      x.fillText(`NÓ ${c + 1}`, u(2), u(7.6)); x.textAlign = 'right'; x.fillText(c === 0 ? 'bff-app · catalogo' : c === 1 ? 'pedidos · estoque' : 'pagamentos · recomendacoes', u(cv.c.width / P - 2), u(7.6)); cv.tex.needsUpdate = true; }); }
  function drawScreen(o) {
    const s = cur(), yl = s.ys || s.yaml;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 220) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 12 + i * 44; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 19, 220); x.fillText(val, u(10), u(Y + 18)); });
    const L0 = 252; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(137)); x.stroke();
    lbl(s.yk || 'REGRA ATIVA', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(25 + i * 12.6)); });
    lbl('RESPOSTA', L0, 104);
    x.fillStyle = o.res.length ? acc : INK(); (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { if (/^(5|4)\d\d|recus|DENY/.test(l)) x.fillStyle = BAD(); fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(117 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">80 ms de chamada, p50/p99, 12 req/s e o custo de 0,1 vCPU e 50 MB por proxy são números de exemplo do módulo, na ordem de grandeza real; 1 ms é o custo aproximado dos 2 proxies.</li>';
  const DATA = {
    sem: () => `<li>Chamada: <b>POST /cobrancas</b> com <b>${BODY}</b></li><li>pedidos (Go): retry <b>5× sem espera</b> → 6 chamadas num 503 · estoque (Java): <b>sem TLS</b> · catalogo (Node.js): <b>sem métrica</b></li><li>3 linguagens = 3 bibliotecas de rede para manter; mudar uma regra = mudar 3 códigos.</li>${EX}`,
    sidecar: () => `<table class="h3-sum"><tr><th>o quê</th><th>com sidecar</th></tr><tr><td>proxies</td><td>30 Envoys (1 por pod)</td></tr><tr><td>no caminho</td><td>2 por chamada · ~1 ms (80 → 81 ms)</td></tr><tr><td>identidade</td><td>${SID('pedidos')}</td></tr><tr><td>custo</td><td>30 × 0,1 vCPU = <b>3 vCPU</b> · 30 × 50 MB = <b>1,5 GB</b></td></tr><tr><td>trocar o Envoy</td><td>recriar os 30 pods</td></tr></table>
      <li>mTLS: os <b>dois lados</b> apresentam certificado (no TLS do módulo 1, só o servidor). O istiod emite e troca (validade de exemplo: 24 h).</li><li>Métricas do Envoy: <b>istio_requests_total</b>, <b>istio_request_duration_milliseconds</b>, por par de serviços; spans com o trace_id 7f3a…</li>${EX}`,
    regras: () => `<li><b>Canary</b>: 90 / 10 por peso; com <b>x-versao: v2</b>, sempre v2</li><li><b>Retry</b>: attempts 2, retryOn "503"; o Envoy espera <b>25 ms</b> entre tentativas (o padrão dele); 81 + 25 + 81 = <b>187 ms</b>. Só porque a cobrança do pedido_id 1048 é idempotente.</li><li><b>Timeout</b>: 2 s → <b>504</b> upstream request timeout</li><li><b>AuthorizationPolicy</b>: catalogo → POST /cobrancas = <b>403 RBAC: access denied</b></li><li><b>istiod fora</b>: as chamadas seguem com a última configuração; regra nova não chega; certificados vencem em 24 h sem troca.</li>${EX}`,
    falha: () => `<li><b>Abort</b>: 10% de 503, devolvido pelo Envoy de quem chama (<b>fault filter abort</b>); o recomendacoes nem recebe</li><li><b>Delay</b>: 10% com 2 s; o bff-app desiste em <b>100 ms</b> e responde com "recomendado": []</li><table class="h3-sum"><tr><th>retries</th><th>bff-app</th><th>pedidos</th><th>pagamentos</th></tr><tr><td>3 em cada camada</td><td>3</td><td>9</td><td><b>27</b></td></tr><tr class="on"><td>só no último salto</td><td>1</td><td>1</td><td><b>3</b></td></tr></table>${EX}`,
    ambient: () => `<table class="h3-sum"><tr><th></th><th>sidecar</th><th>ambient</th></tr><tr><td>onde mora</td><td>no pod</td><td>no nó (ztunnel) + waypoint</td></tr><tr><td>quantos</td><td>30</td><td>3 ztunnels + 1 waypoint</td></tr><tr class="on"><td>vCPU · memória</td><td>3 · 1,5 GB</td><td>0,4 · 200 MB</td></tr><tr><td>L4 (mTLS, identidade)</td><td>Envoy</td><td>ztunnel</td></tr><tr><td>L7 (retry, rota, RBAC)</td><td>Envoy</td><td>waypoint</td></tr></table>
      <li>O túnel entre ztunnels é <b>HBONE</b> (mTLS, porta <b>15008</b>).</li><li>Regra com L7 (método, caminho) aplicada por um ztunnel <b>vira DENY</b>: falha fechada.</li><li class="h3-dim">No exemplo, um ztunnel e um waypoint custam o mesmo que um sidecar (0,1 vCPU · 50 MB).</li>`,
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
      <div class="i3-count" id="m3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'Regra ativa')}</b>${esc(s.yaml.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'mesh') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 220, -150), dist: innerWidth < 640 ? 14 : 17 } : { target: W(150, 220, 60), dist: 15.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
