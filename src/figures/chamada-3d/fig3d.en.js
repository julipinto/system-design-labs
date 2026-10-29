// Figura 3D (iso-glow): a mesma chamada de várias formas. O pedidos cobra o pedido 1050 do Davi (caneca azul 19.90 + frete 9.00 = 28.90,
// 2890 centavos, Pix) no pagamentos. Entre os dois, o fio é uma fita: cada casa é 1 byte, e o pedido anda por ela como bytes de verdade
// (as letras do HTTP/1.1, os quadros do HTTP/2 com os 11 bytes do Protobuf).
// Cena: ao fundo, o mostrador (contadores, o que está no fio, a resposta) e um bloco de contrato (net/rpc, tabela HPACK, .proto, schema).
// Na frente: quem chama à esquerda, quem responde à direita, a fita no meio; stub e skeleton colados na frente (RPC);
// uma fileira de serviços na beira da prancha (PSP, resolvers do GraphQL, o desenho final).
// Cenários (toggle e ?mode=rest|rpc|grpc|proto|graphql|converge; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-sincrona-brief.md). Bytes do gRPC medidos com grpc-go 1.62.1
// e um proxy que lê os quadros (docs/escrita/comunicacao-sincrona-medida-grpc/).
FIGS3D.push({ id: 'chamada', name: 'Synchronous communication', mod: (() => {
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

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['rest', 'rpc', 'grpc', 'proto', 'graphql', 'converge'];
  const SCNAME = { rest: 'REST', rpc: 'RPC', grpc: 'gRPC', proto: 'Proto', graphql: 'GraphQL', converge: 'Together' };
  const SCFULL = { rest: 'REST: HTTP/1.1 and JSON', rpc: 'RPC: stub, network, skeleton', grpc: 'gRPC: HTTP/2 and frames',
    proto: 'Protobuf: the 11 bytes', graphql: 'GraphQL: the client chooses', converge: 'Each protocol in its place' };
  const AULA = { rest: 'aula-2-http-e-rest', rpc: 'aula-4-rpc', grpc: 'aula-5-grpc-e-protobufs', proto: 'aula-5-grpc-e-protobufs',
    graphql: 'aula-7-graphql', converge: 'aula-8-convergencias-arquiteturais' };
  const BODY = '{"pedido_id":1050,"valor_centavos":2890,"meio":"pix"}';
  const RBODY = '{"cobranca_id":"c-7731","status":"pendente"}';
  const REQH = 'POST /cobrancas HTTP/1.1\r\nHost: pagamentos:8080\r\nUser-Agent: pedidos-go/1.0\r\nAccept: application/json\r\nContent-Type: application/json\r\nContent-Length: 53\r\n\r\n';
  const RESH = 'HTTP/1.1 202 Accepted\r\nContent-Type: application/json\r\nContent-Length: 44\r\nLocation: /cobrancas/c-7731\r\n\r\n';
  const GQL = '{destaque:produto(id:42){nome preco foto}carrinho{itens}recomendado:recomendados(produto:42){id nome preco}pedido(id:1048){status}}';
  const GQLR = '{"data":{"destaque":{"nome":"gato de pelúcia","preco":79.90,"foto":"gato-320.webp"},"carrinho":{"itens":1},"recomendado":[{"id":7,"nome":"caneca azul","preco":19.90}],"pedido":{"status":"a caminho"}}}';
  const JRPC = '{"jsonrpc":"2.0","method":"Frete.Calcular","params":{"cep":"50050-000","peso_kg":0.4},"id":1}';
  const PB = ['08', '9a', '08', '10', 'ca', '16', '1a', '03', '70', '69', '78'];
  const PBR = ['0a', '06', '63', '2d', '37', '37', '33', '31', '12', '08', '70', '65', '6e', '64', '65', '6e', '74', '65'];
  let clk = 0, sc = 'rest', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-chamada3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── bytes: cada casa da fita é 1 byte ──
  // papéis: h cabeçalho em texto · c CR/LF · b corpo · f cabeçalho de quadro HTTP/2 (9 B) · k cabeçalhos HPACK · g prefixo do gRPC (5 B) · r repetido
  const enc = new TextEncoder();
  function text(s, role) { const out = []; for (const ch of s) { const n = enc.encode(ch).length;
      out.push({ ch: ch === '\r' ? '·' : ch === '\n' ? '↵' : ch === ' ' ? '' : ch, role: ch === '\r' || ch === '\n' ? 'c' : role });
      for (let i = 1; i < n; i++) out.push({ ch: '·', role }); } return out; }
  const hex = (list, role) => list.map(h => ({ ch: h, role }));
  const blank = (n, role, ch = '') => Array.from({ length: n }, () => ({ ch, role }));
  const h2 = n => n.toString(16).padStart(2, '0');
  // cabeçalho de quadro HTTP/2: 3 B de tamanho, 1 de tipo, 1 de flags, 4 de stream
  const frame = (len, type, flags, sid) => hex([h2(len >> 16), h2((len >> 8) & 255), h2(len & 255), h2(type), h2(flags), '00', '00', '00', h2(sid)], 'f');
  const REQ = [...text(REQH, 'h'), ...text(BODY, 'b')];                    // 157 + 53 = 210 B
  const RES = [...text(RESH, 'h'), ...text(RBODY, 'b')];                   // 106 + 44 = 150 B
  const REQ2 = [...text(REQH, 'r'), ...blank(53, 'b', '·')];               // a próxima: os mesmos 157 B
  const G1C = [...frame(102, 1, 4, 1), ...blank(102, 'k', '·'), ...frame(16, 0, 1, 1), ...hex(['00', '00', '00', '00', '0b'], 'g'), ...hex(PB, 'b')];   // 136 B
  const G1S = [...frame(19, 1, 4, 1), ...blank(19, 'k', '·'), ...frame(23, 0, 0, 1), ...hex(['00', '00', '00', '00', '12'], 'g'), ...hex(PBR, 'b'), ...frame(24, 1, 5, 1), ...blank(24, 'k', '·')];  // 93 B
  const G2C = [...frame(15, 1, 4, 5), ...blank(15, 'k', '·'), ...frame(16, 0, 1, 5), ...hex(['00', '00', '00', '00', '0b'], 'g'), ...hex(PB, 'b')];      // 49 B
  const G2S = [...frame(2, 1, 4, 5), ...blank(2, 'k', '·'), ...frame(23, 0, 0, 5), ...hex(['00', '00', '00', '00', '12'], 'g'), ...hex(PBR, 'b'), ...frame(2, 1, 5, 5), ...blank(2, 'k', '·')];      // 54 B
  const STUBM = [...text('Frete.Calcular', 'h'), ...text(' Cep "50050-000" PesoKg 0.4', 'b')];
  const STUBR = text('15.00', 'b');
  const JR = text(JRPC, 'b'), GQ = text(GQL, 'b'), GR = text(GQLR, 'b');
  const NQ = text('{produtos(first:20){nome estoque{quantidade}}}', 'b');

  // ── geometria ──
  const PL = 7, Z = 10;
  // o fio: uma grade de 30 casas por linha; cada casa é 1 byte, escrito a 90 bytes por segundo
  const TX = 236, TY = 196, TW = 343, TD = 112, COLS = 30, CW = 11.4, CH = 15, RATE = 90;
  const fdur = n => n / RATE;
  plateWith(g0, 815, 422, [[14, 14], [801, 14], [14, 408], [801, 408]]);
  hazeAndShadow(g0, 407, 211, 9.6, 5.4);
  // mostrador ao fundo
  rbox(262, 12, PL, 540, 12, 150, 5, bodyMat, g0);
  const scr = faceCanvas('front', 266, 24, 154, 532, 143, 4, g0);
  function block(x, y, w, d, h, kind, extra) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'tape' ? 2 : 5, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    return { g, mat, top, glow, x, y, w, d, h, kind, key: '', f: 1, ...extra };
  }
  const FX = i => 24 + i * 155, FY = 360, FW = 140, FD = 40, FC = i => FX(i) + FW / 2;
  const B = {
    K: block(20, 16, 222, 84, 30, 'k'),
    L: block(24, TY, 206, TD, 26, 'app'), R: block(585, TY, 206, TD, 26, 'app'), M: block(312, TY, 192, TD, 26, 'app'),
    stub: block(24, 314, 206, 28, 18, 'side'), skel: block(585, 314, 206, 28, 18, 'side'),
    tape: block(TX, TY, TW, TD, 2, 'tape'),
  };
  [0, 1, 2, 3, 4].forEach(i => { B['F' + i] = block(FX(i), FY, FW, FD, 18, 'f'); });
  const NAMES = Object.keys(B);
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 12 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.flat ? 0.01 : b.on ? 6 : 4) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length && !b.flat) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); D.g.scale.setScalar(1); moveGlow(D.glow, p, 0.9); }
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
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(11), tag(11)];

  // ── rotas (no chão, z = 10) ──
  const rev = pts => pts.slice().reverse();
  const YM = TY + TD / 2, YF = TY + TD;                                              // meio e beira da frente da fileira principal
  const TAPE = [[230, YM, 13], [585, YM, 13]];                                       // por cima do fio, de L a R
  const STUBT = [[230, 328, Z], [252, 328, Z], [252, YF, Z]], SKELT = [[563, YF, Z], [563, 328, Z], [585, 328, Z]];
  const RX = [0, 612, 652, 692, 732], LANE = [0, 322, 330, 338, 346];
  const RF = i => [[RX[i], YF, Z], [RX[i], LANE[i], Z], [FC(i), LANE[i], Z], [FC(i), FY, Z]];
  const R_F4 = [[714, YF, Z], [714, FY, Z]];
  const LM = (y = YM) => [[230, y, Z], [312, y, Z]], MR = (y = YM) => [[504, y, Z], [585, y, Z]];
  const F4F2 = [[FX(4), FY + 20, Z], [FX(2) + FW, FY + 20, Z]], HOOK = [[FC(2), FY + FD, Z], [FC(2), 410, Z], [700, 410, Z], [700, FY + FD, Z]];
  const F0F4 = [[FC(0), FY + FD, Z], [FC(0), 416, Z], [688, 416, Z], [688, FY + FD, Z]], F1F4 = [[FC(1), FY + FD, Z], [FC(1), 408, Z], [740, 408, Z], [740, FY + FD, Z]];
  const M_F4 = [[408, YF, Z], [408, 350, Z], [714, 350, Z], [714, FY, Z]];
  // balões: na faixa livre ao lado de cada peça
  const ABOVE = { K: [131, 112, 40], L: [127, 168, 26], R: [688, 168, 26], M: [408, 168, 26], tape: [407, 180, 30],
    stub: [127, 352, 8], skel: [688, 352, 8], F0: [FC(0), 414, 10], F1: [FC(1), 414, 10], F2: [FC(2), 414, 10], F3: [FC(3), 414, 10], F4: [FC(4), 414, 10] };
  // L e R: o balão vai na frente da peça; no RPC, na frente do stub e do skeleton
  const spot = k => (k === 'L' || k === 'R') ? (sc === 'rpc' ? [k === 'L' ? 127 : 688, 358, 8] : [k === 'L' ? 127 : 500, 334, 6]) : ABOVE[k];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : spot(at)), text, tone]);

  // ── conteúdo dos blocos ──
  const R_ = (name, lang, ...rows) => ({ name, lang, rows });
  const PED = (...r) => R_('pedidos', 'Go', ...(r.length ? r : [['order 1050 · 28.90'], ['Pix · 2890 cents', 'dim']]));
  const PAG = (...r) => R_('pagamentos', 'Go', ...(r.length ? r : [['POST /cobrancas', 'dim'], ['creates the charge at the PSP', 'dim']]));
  const PSP = (...r) => R_('PSP', 'external', ...(r.length ? r : [['Pix provider', 'dim']]));
  const SHOW = {
    rest: ['L', 'R', 'tape', 'F4'], rpc: ['L', 'R', 'tape', 'stub', 'skel', 'K'], grpc: ['L', 'R', 'tape', 'K'], proto: ['L', 'R', 'tape', 'K'],
    graphql: ['L', 'R', 'tape', 'K', 'F1', 'F2', 'F3', 'F4'], converge: ['L', 'M', 'R', 'F2', 'F4'],
  };
  const HPK = (...r) => R_('HPACK', 'dynamic table', ...(r.length ? r : [['empty: new connection', 'dim']]));
  const PROTO = (...r) => R_('pagamentos.proto', 'v1', ...(r.length ? r : [['message CobrancaRequest {', 'dim'], ['  int64 pedido_id = 1;'], ['  int64 valor_centavos = 2;'], ['  string meio = 3; }']]));
  const SCHEMA = R_('schema', 'SDL', ['type Produto { id nome preco }', 'dim'], ['type Query { produto', 'dim'], ['  recomendados carrinho pedido }', 'dim'], ['type Mutation { criarPedido }', 'dim']);
  const ROWS = {
    rest: () => ({ L: PED(), R: PAG(), F4: PSP() }),
    rpc: () => ({ L: PED(['frete.Calcular(...)'], ['looks like a local function', 'dim']), R: R_('entregas', 'Go', ['func Calcular(args, reply)'], ['shipping for the CEP', 'dim']),
      stub: R_('STUB', '', ['pretends to be the entregas', 'dim']), skel: R_('SKELETON', '', ['calls the real function', 'dim']),
      K: R_('net/rpc', 'Go', ['encodes in gob', 'dim'], ['no .proto, no schema', 'dim'], ['client and server in Go', 'dim']) }),
    grpc: () => ({ L: PED(['Pagamentos.Cobrar(ctx, req)'], ['deadline: 1 s', 'dim']), R: PAG(['rpc Cobrar', 'dim'], ['port 50051 · HTTP/2', 'dim']), K: HPK(),
      M: R_('Layer 4 LB', '', ['balances connections', 'dim']), F4: R_('pagamentos-2', 'replica', ['waiting', 'dim']) }),
    proto: () => ({ L: PED(['CobrancaRequest'], ['1050 · 2890 · "pix"', 'dim']), R: PAG(['reads via the .proto', 'dim'], ['fields 1, 2, 3', 'dim']), K: PROTO() }),
    graphql: () => ({ L: R_("Lena's app", 'home screen', ['1 query', 'dim'], ['chooses the fields', 'dim']),
      R: R_('graphql', 'in place of bff-app', ['POST /graphql', 'dim'], ['1 resolver per field', 'dim']), K: SCHEMA,
      F1: R_('catalogo', '', ['destaque', 'dim']), F2: R_('carrinho', '', ['carrinho', 'dim']),
      F3: R_('recomendacoes', '', ['recomendado', 'dim']), F4: R_('pedidos', '', ['order 1048', 'dim']) }),
    converge: () => ({ L: R_("Davi's app", 'phone', ['pedido 1050', 'dim'], ['website and partner too', 'dim']), M: R_('gw-loja', 'gateway', ['REST outside', 'dim'], ['gRPC inside', 'dim']),
      R: PED(['Pedidos.Criar', 'dim'], ['gRPC · mTLS', 'dim']), F4: R_('pagamentos', '', ['Pagamentos.Cobrar', 'dim']), F2: R_('PSP', 'external', ['outbound REST', 'dim']),
      F0: R_('relatorios', '', ['.proto client', 'dim']), F1: R_('bff-app', '', ['.proto client', 'dim']),
      K: R_('pagamentos.proto', 'v2', ['by email, no version', 'bad']) }),
  };

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const o = { show: {}, on: {}, rows: ROWS[sc](), beams: [], tags: [], msgs: [], dots: [], cnt: [], res: [], tape: null };
    SHOW[sc].forEach(k => o.show[k] = 1);
    return o;
  }
  // uma mensagem que viaja por uma rota (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { const e = ease(f); o.beams.push({ pts, on: true, dot: f < 1 ? e : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, e, text, tone]);
      if (f < 1) o.dots.push(alongPts(pts, cumLen(pts), e)); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  // os bytes são escritos no fio, um por casa, na ordem em que saem; dir 1 = de L para R, -1 = de R para L.
  // A mensagem fica no fio até a próxima. Devolve quantos bytes já foram.
  function flow(o, t, a, cells, dir = 1, ends = ['L', 'R']) {
    const N = cells.length;
    if (t < a) return { n: 0, done: false, run: false };
    const n = Math.min(N, Math.floor((t - a) * RATE) + 1), done = n >= N, [s, r] = dir > 0 ? ends : [ends[1], ends[0]];
    o.tape = { cells, n, dir }; if (!done) o.on[s] = 1; else if (t - a - N / RATE < 1.2) o.on[r] = 1;
    o.beams.push({ pts: dir > 0 ? TAPE : rev(TAPE), on: !done, dot: done ? null : n / N, flat: true });
    return { n, done, run: !done };
  }
  const C3 = (...c) => c;   // contadores do mostrador: [rótulo, valor, tom]
  const B_ = (n, N) => `${n} of ${N} B`;

  const STEPS = {
    rest: [
      { id: 'espera', dur: 6, title: 'The pedidos calls and waits', yk: 'IN THE CODE · pedidos (Go)', rk: 'RESPONSE',
        yaml: ['res, err := http.Post(', '  "http://pagamentos:8080/cobrancas",', '  "application/json", body)', '// the goroutine stops here until the', '// response (or the error) comes back'],
        story: 'Davi closed order 1050: the blue mug (19.90) plus shipping to SP (9.00), 28.90, which becomes 2890 cents in a Pix. The pedidos calls the pagamentos, the pagamentos calls the PSP, and each one sits idle until the response comes back. That is a synchronous call: simple to follow, and the caller inherits the delay of everyone behind it.',
        look: 'The light goes from the pedidos to the pagamentos, down to the PSP and only then comes back. The pedidos clock runs the whole time.',
        key: 'Synchronous call: the caller stops and waits; the time of whoever is behind becomes its own.',
        f(o, t) { const ms = Math.round(clamp((t - 0.3) / 4.4) * 185);
          send(o, t, 0.3, 1.0, TAPE, 'POST /cobrancas', 'hi', 0.2); send(o, t, 1.0, 1.6, R_F4, 'Pix charge · 28.90', 'hi', 1.6);
          if (t > 1.6 && t < 3.4) { o.on.F4 = 1; o.rows.F4 = PSP(['processing · 180 ms']); }
          send(o, t, 3.4, 4.0, rev(R_F4), 'c-7731', 'acc', 0.2);
          if (send(o, t, 4.0, 4.7, rev(TAPE), '202 Accepted', 'acc')) o.res = ['202 Accepted · 185 ms', RBODY];
          if (t > 0.3) { o.on.L = 2; o.rows.L = PED(['waiting for the response…', t > 4.7 ? 'dim' : 'acc'], [`${ms} ms idle`, 'dim']); }
          o.cnt = C3(['THE PEDIDOS WAITS', ms + ' ms'], ['TO THE PAGAMENTOS', '5 ms'], ['PAGAMENTOS TO PSP', '180 ms (internet)']);
          if (t > 4.9) T(o, 'L', '185 ms idle: 5 + 180', 'acc'); } },
      { id: 'pedido', dur: 5, pt: 3.2, title: 'The order becomes 210 bytes on the wire', yk: 'ON THE WIRE · HTTP/1.1 (text)', rk: 'BODY · 53 B',
        yaml: REQH.split('\r\n').filter(Boolean).concat(['', BODY]), ys: REQH.split('\r\n').filter(Boolean),
        story: 'This is what the pedidos sends, letter by letter: a line with the method and the path, five headers and a blank line, which add up to 157 bytes, and then the JSON body, with 53. In HTTP/1.1 without TLS it is plain text: you can read every byte. With the mesh mTLS (module 10) the bytes are the same, only encrypted.',
        look: 'The tape between the two is the wire, and each cell of it is 1 byte. 157 header cells go by and, last, the 53 of the body, lit up.',
        key: 'In HTTP/1.1 the order is text: 157 B of headers plus 53 B of body, 210 B.',
        f(o, t) { const r = flow(o, t, 0.4, REQ);
          o.cnt = C3(['BYTES ARRIVED', B_(r.n, 210)], ['HEADERS', '157 B'], ['BODY (JSON)', '53 B']);
          o.res = [BODY];
          if (r.run) T(o, 'tape', 'POST /cobrancas · 210 B', 'acc'); if (r.done) T(o, 'R', '210 B received', 'acc'); } },
      { id: 'resposta', dur: 5, pt: 1.8, title: '202 Accepted: 150 bytes back', yk: 'ON THE WIRE · the response', rk: 'BODY · 44 B',
        yaml: RESH.split('\r\n').filter(Boolean).concat(['', RBODY]), ys: RESH.split('\r\n').filter(Boolean),
        story: 'The pagamentos answers 202 Accepted: the charge c-7731 was accepted, but is still pending, because Davi has not paid the Pix. The Location header says where to check the charge later. That is 106 bytes of header and 44 of body. Round trip, the call cost 360 bytes, and 263 of them are headers.',
        look: 'Now the tape runs the other way: from the pagamentos to the pedidos, 150 cells.',
        key: '202 means "I accepted it, but I have not finished"; the whole call cost 360 B.',
        f(o, t) { const r = flow(o, t, 0.4, RES, -1);
          o.cnt = C3(['BYTES BACK', B_(r.n, 150)], ['THE WHOLE CALL', '210 + 150 = 360 B'], ['HEADERS ONLY', '157 + 106 = 263 B']);
          o.res = [RBODY]; if (r.done) o.rows.L = PED(['charge c-7731'], ['status: pending', 'dim']);
          if (r.run) T(o, 'tape', '202 Accepted · 150 B', 'acc'); if (r.done) T(o, 'L', 'c-7731 · pending', 'acc'); } },
      { id: 'repete', dur: 5.6, pt: 2.3, title: 'The next call sends everything again', yk: 'ON THE WIRE · the next charge', rk: 'WHAT CHANGES',
        yaml: REQH.split('\r\n').filter(Boolean).concat(['', '{… another order: the body changes …}']), ys: REQH.split('\r\n').filter(Boolean),
        story: 'The next charge comes, from another order. The body changes, but the 157 bytes of headers go out the same, letter by letter: Host, User-Agent, Accept, Content-Type. HTTP/1.1 remembers nothing from the previous call, not even when it reuses the same TCP connection. On every call the 360 bytes go again.',
        look: 'The 157 header cells go by again, marked as repeated; only the 53 of the body are new.',
        key: 'In HTTP/1.1 the headers travel whole on every call.',
        f(o, t) { const r = flow(o, t, 0.4, REQ2);
          o.cnt = C3(['BYTES ARRIVED', B_(r.n, 210)], ['REPEATED FROM THE PREVIOUS', '157 B'], ['2 CALLS', '2 × 360 = 720 B']);
          o.res = ['only the body: 53 new B'];
          if (r.run) T(o, 'tape', '157 B same as the previous', 'acc'); if (r.done) T(o, 'R', 'same headers, again', 'acc'); } },
      { id: 'timeout', dur: 7, title: 'What if it fails: the PSP takes 8 s', yk: 'IN THE CODE · pagamentos', rk: 'RESPONSE',
        yaml: ['ctx, cancel := context.WithTimeout(', '  ctx, 2*time.Second)  // module 10', 'res, err := psp.Cobrar(ctx, 2890)', '// err: context deadline exceeded', '// but c-7731 already exists at the PSP'],
        story: 'Now the PSP gets slow and takes 8 s to answer. The pagamentos waits at most 2 s (the timeout from module 10), gives up and returns an error; the pedidos tells Davi it did not work. But at the PSP, the charge c-7731 had already been created. Davi can pay the Pix for an order the store reported as failed: the caller does not know whether the other side did it or not.',
        look: 'The PSP turns red and the pagamentos clock stops at 2,000 ms; the error comes back, and then the PSP lights up with c-7731 created.',
        key: 'A timeout undoes nothing: the caller does not know whether the other side finished.',
        f(o, t) { const ms = t < 1.2 ? 0 : Math.min(2000, Math.round((t - 1.2) / 2.2 * 2000));
          send(o, t, 0.3, 0.8, TAPE, 'POST /cobrancas', 'hi', 0.2); send(o, t, 0.8, 1.2, R_F4, 'Pix charge · 28.90', 'hi', 5);
          if (t > 1.2) { o.on.F4 = 'bad'; o.rows.F4 = PSP([t > 5.6 ? 'c-7731 created' : 'slow: 8 s', 'bad']); }
          if (t > 1.2) o.rows.R = PAG([`waiting for the PSP: ${ms} ms`, ms >= 2000 ? 'bad' : 'acc'], ['timeout: 2 s', 'dim']);
          if (send(o, t, 3.5, 4.2, rev(TAPE), 'error: 2 s timeout', 'bad')) { o.res = ['error · context deadline exceeded', 'Davi sees: "it did not work"']; o.on.L = 'bad'; o.rows.L = PED(['order 1050 · failed', 'bad'], ['told Davi', 'dim']); }
          o.cnt = C3(['THE PAGAMENTOS WAITS', ms + ' ms', ms >= 2000 ? 'bad' : ''], ['TIMEOUT', '2 s'], ['AT THE PSP', t > 5.6 ? 'c-7731 exists' : '…', 'bad']);
          if (t > 5.6) T(o, 'F4', 'the charge exists:\nDavi can pay', 'bad'); } },
      { id: 'duplica', dur: 7.5, title: 'What if it fails: repeating the POST creates two orders', yk: 'ON THE WIRE · app → pedidos', rk: 'RESPONSE',
        yaml: ['POST /api/v1/pedidos HTTP/1.1', 'Content-Type: application/json', '# body: the blue mug (product 7), Pix', '# the response is slow; the app tries again', '# fix: Idempotency-Key: 3f9a…'],
        ys: ['POST /api/v1/pedidos HTTP/1.1', '# the response is slow:', '#   the app sends the same POST again', '# POST is not idempotent', '# fix:', 'Idempotency-Key: 3f9a…'],
        story: 'One step back: now the caller is Davi\'s app, and the one answering is the pedidos. The app sends POST /api/v1/pedidos, the response is slow and the app tries again. POST is not idempotent: the pedidos creates 1050 and one more, and two charges of 28.90 go out. That is why the mesh from module 10 only retries idempotent operations.',
        look: 'The app sends the same POST twice; the pedidos turns red with two orders, and the PSP with two charges.',
        key: 'A repeated POST creates again; an Idempotency-Key makes the server return the same response.',
        f(o, t) { o.rows.L = R_("Davi's app", 'phone', ['POST /api/v1/pedidos'], [t > 2.4 ? 'no response: again' : 'waiting…', t > 2.4 ? 'bad' : 'dim']);
          let n = 0, c = 0; if (t > 1.1) n = 1; if (t > 3.1) n = 2;
          send(o, t, 0.3, 1.1, TAPE, 'POST /api/v1/pedidos', 'hi', 0.2); send(o, t, 2.4, 3.1, TAPE, 'the same POST, again', 'bad', 0.2);
          if (t > 1.6) c = 1; if (t > 3.6) c = 2;
          send(o, t, 1.1, 1.6, R_F4, '28.90', 'hi', 0.2); send(o, t, 3.1, 3.6, R_F4, '28.90 again', 'bad', 0.2);
          o.rows.R = PED([n ? 'order 1050 · 28.90' : '…', n ? '' : 'dim'], [n > 1 ? 'another order · 28.90' : '', 'bad']);
          if (n > 1) o.on.R = 'bad'; if (c) o.rows.F4 = PSP([`${c} charge${c > 1 ? 's' : ''} of 28.90`, c > 1 ? 'bad' : '']); if (c > 1) o.on.F4 = 'bad';
          if (send(o, t, 4.2, 5.0, rev(TAPE), '201 · 201', 'acc', 0.3)) o.res = ['201 Created · order 1050', '201 Created · another order'];
          o.cnt = C3(['POSTS SENT', String(n)], ['ORDERS CREATED', String(n), n > 1 ? 'bad' : ''], ['CHARGES OF 28.90', String(c), c > 1 ? 'bad' : '']);
          if (t > 5.2) { T(o, 'R', 'two orders for one click', 'bad'); T(o, 'L', 'fix: Idempotency-Key: 3f9a…', 'acc'); } } },
    ],
    rpc: [
      { id: 'local', dur: 5, title: 'It looks like a local function', yk: 'IN THE CODE · pedidos (Go)', rk: 'WHAT THE CODE SEES',
        yaml: ['var frete float64', 'err := client.Call("Frete.Calcular",', '  Args{Cep: "50050-000", PesoKg: 0.4},', '  &frete)', '// looks local: call and wait'],
        story: 'REST names things, like /pedidos/1050. RPC names actions: the pedidos wants the shipping of the mug to Recife and writes Frete.Calcular with the CEP 50050-000 (the postal code) and 0.4 kg, as if the function were right there. It is not: it runs in the entregas service, on another machine. What receives the call in the pedidos is a stub, a stand-in for the function.',
        look: 'The pedidos lights up and the light enters the STUB, glued to its front. The entregas, on the other side, does not even know yet.',
        key: 'RPC: call a procedure on another machine as if it were local (Birrell and Nelson, 1984).',
        f(o, t) { if (t > 0.3) o.on.L = 1; if (t > 1.2) { o.on.stub = 1; o.rows.stub = R_('STUB', '', ['received Frete.Calcular', 'acc']); }
          send(o, t, 0.3, 1.2, [[127, YF, Z], [127, 314, Z]], '', 'hi', 3);
          o.cnt = C3(['THE CALL', 'Frete.Calcular'], ['ARGUMENTS', '50050-000 · 0.4 kg'], ['WHERE IT RUNS', 'in the entregas']);
          o.res = t > 1.2 ? ['the stub caught the call'] : [];
          if (t > 1.6) T(o, 'stub', 'the stub pretends to be the entregas'); } },
      { id: 'stub', dur: 5.5, pt: 1.2, title: 'The stub packs it and sends it over the network', yk: 'ON THE WIRE · net/rpc', rk: 'FORMAT',
        yaml: ['// the stub serializes name and arguments', 'ServiceMethod: "Frete.Calcular"', 'Args{Cep: "50050-000", PesoKg: 0.4}', '// encoding: gob (Go binary)', '// port 1234 in the lab'],
        story: 'The stub turns the call into bytes: the method name and the arguments. In Go\'s net/rpc, that is gob, a binary format that only Go reads. The bytes go over the network to the other side, where a skeleton waits.',
        look: 'The method name and the arguments walk along the tape, from the stub to the SKELETON of the entregas.',
        key: 'The stub serializes the call; the caller does not see the network.',
        f(o, t) { const r = flow(o, t, 0.4, STUBM, 1, ['stub', 'skel']); o.on.L = 2;
          if (r.run || r.done) { o.beams.push({ pts: STUBT, on: r.run }, { pts: SKELT, on: r.run }); }
          o.cnt = C3(['THE STUB SENDS', 'Frete.Calcular + Args'], ['FORMAT', 'gob (Go only)'], ['PORT IN THE LAB', '1234']);
          o.res = ['gob: Go binary'];
          if (r.run) T(o, 'tape', 'Frete.Calcular · 50050-000 · 0.4', 'acc'); if (r.done) T(o, 'skel', 'the skeleton received', 'acc'); } },
      { id: 'skeleton', dur: 6, title: 'The skeleton calls the real function', yk: 'IN THE CODE · entregas (Go)', rk: 'RESPONSE',
        yaml: ['func (f *Frete) Calcular(', '  args Args, reply *float64) error {', '  *reply = tabela(args.Cep, args.PesoKg)', '  return nil  // 15.00 to Recife', '}'],
        story: 'The skeleton unpacks the bytes and calls Calcular for real, in the entregas. For the CEP 50050-000 and 0.4 kg, the shipping is 15.00, the same as Recife in module 6. The response goes back along the same path: skeleton, network, stub, and the pedidos receives 15.00 as if it had called a function of its own. In the lab, the same design gives Proteinas.Recomendacao: weight 85, response 170 g.',
        look: 'The entregas lights up with the calculation; the 15.00 comes back along the tape to the stub and enters the pedidos.',
        key: 'The skeleton deserializes and calls the function; the response takes the way back.',
        f(o, t) { if (t > 0.3) { o.on.skel = 1; } if (t > 0.8) { o.on.R = 1; o.rows.R = R_('entregas', 'Go', ['Calcular(50050-000, 0.4)'], ['= 15.00', 'acc']); }
          send(o, t, 0.3, 0.8, [[688, 314, Z], [688, YF, Z]], '', 'hi', 0.2);
          const r = flow(o, t, 1.6, STUBR, -1, ['stub', 'skel']);
          if (r.run) o.beams.push({ pts: STUBT, on: true }, { pts: SKELT, on: true });
          if (r.done) { o.on.stub = 1; send(o, t, 1.6 + fdur(5), 2.2 + fdur(5), [[127, 314, Z], [127, YF, Z]], '', 'acc', 3); }
          if (r.done && t > 2.3 + fdur(5)) { o.on.L = 1; o.rows.L = PED(['shipping = 15.00', 'acc'], ['as if it were local', 'dim']); o.res = ['shipping = 15.00 · err = nil']; }
          o.cnt = C3(['SHIPPING', r.done ? '15.00' : '…'], ['CEP', '50050-000 (Recife)'], ['IN THE LAB', 'weight 85 → 170 g']);
          if (r.run) T(o, 'tape', '15.00', 'acc'); } },
      { id: 'contrato', dur: 5.5, pt: 1.6, title: 'No contract: only speaks Go', yk: 'ON THE WIRE · JSON-RPC 2.0', rk: 'THE SAME CALL',
        yaml: [JRPC.slice(0, 41), JRPC.slice(41)], ys: ['{"jsonrpc":"2.0",', ' "method":"Frete.Calcular",', ' "params":{"cep":"50050-000",', '           "peso_kg":0.4},', ' "id":1}', '// 93 B · any language reads it'],
        story: 'The net/rpc has no written contract: the "contract" is the Go type on both sides, and gob only talks to Go clients. The package documentation says it is frozen, with no new features. Other RPCs solve this in different ways: XML-RPC, SOAP, Thrift, gRPC. In JSON-RPC 2.0, the same call becomes 93 bytes of JSON that any language reads.',
        look: 'The net/rpc block in the back lights up; the 93 bytes of the same call in JSON-RPC go along the tape.',
        key: 'net/rpc: no contract outside the Go code, and the package is frozen.',
        f(o, t) { o.on.K = 1; o.rows.K = R_('net/rpc', 'Go', ['contract = Go type', 'bad'], ['gob: only talks to Go', 'bad'], ['frozen package', 'dim']);
          const r = flow(o, t, 0.4, JR, 1, ['stub', 'skel']); if (r.run) o.beams.push({ pts: STUBT, on: true }, { pts: SKELT, on: true });
          o.cnt = C3(['JSON-RPC 2.0', B_(r.n, 93)], ['net/rpc', 'gob · Go only'], ['THE PACKAGE', 'frozen']);
          o.res = ['method + params + id'];
          if (r.run) T(o, 'tape', 'JSON-RPC 2.0 · 93 B', 'acc'); } },
      { id: 'pendurado', dur: 7, title: 'What if it fails: no deadline, waits forever', yk: 'IN THE CODE · the lab client', rk: 'RESPONSE',
        yaml: ['err := client.Call("Frete.Calcular", args, &frete)', '// no deadline: if the server hangs,', '// this line never returns', '// fix: a deadline on every call', '// (gRPC carries the deadline in the context)'],
        ys: ['client.Call("Frete.Calcular",', '  args, &frete)', '// no deadline: if the server hangs,', '//   this line never returns', '// fix: a deadline on', '//   every call'],
        story: 'The lab client calls client.Call with no deadline at all. Now the entregas hangs, in a deadlock like the ones in module 11: it receives the call and does not answer. The pedidos stays hanging on the Call line forever, holding the goroutine and Davi\'s order. RPC makes the network look like a local function, and the network fails in ways a local function does not (Waldo and others, 1994).',
        look: 'The entregas turns red and stops; the pedidos clock never stops climbing and no response comes back along the tape.',
        key: 'Every remote call needs a deadline; without it, a failure on the other side traps the caller.',
        f(o, t) { const s = t < 1.4 ? 0 : Math.round((t - 1.4) * 40);
          const r = flow(o, t, 0.3, STUBM, 1, ['stub', 'skel']); if (r.run) o.beams.push({ pts: STUBT, on: true }, { pts: SKELT, on: true });
          if (r.done) { o.on.R = 'bad'; o.on.skel = 'bad'; o.rows.R = R_('entregas', 'Go', ['hung: deadlock', 'bad'], ['not answering', 'bad']); }
          o.on.L = 2; o.rows.L = PED(['client.Call(...)', 'dim'], [s ? `waiting for ${s} s` : 'waiting…', s ? 'bad' : 'dim']);
          o.cnt = C3(['WAITING FOR', s + ' s', s ? 'bad' : ''], ['CALL DEADLINE', 'none', 'bad'], ['RESPONSE', 'never', 'bad']);
          o.res = s ? ['… nothing comes back'] : [];
          if (t > 4) T(o, 'L', 'hanging forever', 'bad'); if (t > 5.2) T(o, 'K', 'fix: a deadline\non every call', 'acc'); } },
    ],
    grpc: [
      { id: 'chamada', dur: 5, pt: 1.8, title: 'The same charge in gRPC: 136 B', yk: 'ON THE WIRE · HEADERS (HPACK)', rk: 'DATA · 16 B',
        yaml: ['ctx, cancel := context.WithTimeout(ctx, time.Second)', 'res, err := client.Cobrar(ctx, &pb.CobrancaRequest{', '  PedidoId: 1050, ValorCentavos: 2890, Meio: "pix"})', '', ':method POST · :scheme http', ':path /loja.pagamentos.v1.Pagamentos/Cobrar', ':authority · content-type: application/grpc+proto', 'user-agent: grpc-go/1.62.1 · te: trailers', 'grpc-timeout: 996250u'],
        ys: [':method POST · :scheme http', ':path /loja.pagamentos.v1.Pagamentos/Cobrar', 'content-type: application/grpc+proto', 'user-agent: grpc-go/1.62.1', 'te: trailers', 'grpc-timeout: 996250u'],
        story: 'Now the same charge goes in gRPC, over HTTP/2. The pedidos calls Pagamentos.Cobrar with a 1 s deadline, which travels along (grpc-timeout, in microseconds). Two frames go on the wire: a HEADERS of 102 bytes, with the headers compressed by HPACK, and a DATA of 16: 5 of gRPC prefix plus the 11 of Protobuf. Each frame has 9 more of its own header.',
        look: 'On the tape go the frame header (9 cells), the 102 of HPACK, another frame header, the prefix of 5 and, lit up, the 11 bytes of the order.',
        key: 'gRPC: the order becomes HTTP/2 frames; compressed headers and a Protobuf body.',
        f(o, t) { const r = flow(o, t, 0.4, G1C);
          o.cnt = C3(['BYTES ARRIVED', B_(r.n, 136)], ['HEADERS', '9 + 102 B'], ['DATA', '9 + 16 B']);
          o.res = ['00 00 00 00 0b · 08 9a 08 10 ca 16 1a 03 70 69 78'];
          if (r.done) o.rows.K = HPK(['stored the headers'], ['for the next one', 'dim']);
          if (r.run) T(o, 'tape', 'Pagamentos/Cobrar · 136 B', 'acc'); } },
      { id: 'trailers', dur: 5, pt: 1.4, title: 'The response closes with trailers: grpc-status 0', yk: 'ON THE WIRE · response (93 B)', rk: 'BODY · 18 B',
        yaml: ['HEADERS (19 B): :status 200', '  content-type: application/grpc+proto', 'DATA (23 B): 00 00 00 00 12 + 18 B', 'HEADERS, fim (24 B) = trailers:', '  grpc-status: 0', '  grpc-message: (empty)'],
        story: 'The pagamentos answers with three frames: HEADERS (:status 200), DATA with the 18 bytes of the Protobuf response and, last, the trailers, headers that come after the body. That is where the gRPC result goes: grpc-status 0, which means OK. gRPC codes are not HTTP\'s: the 200 only says that HTTP/2 worked. The first call on the connection cost 136 + 93 = 229 bytes.',
        look: 'The tape comes back from the pagamentos: three frames, with the 18 bytes of the response lit up in the middle.',
        key: 'In gRPC the result comes in the trailers (grpc-status), after the body.',
        f(o, t) { const r = flow(o, t, 0.4, G1S, -1);
          o.cnt = C3(['BYTES BACK', B_(r.n, 93)], ['1ST CALL', '136 + 93 = 229 B'], ['GRPC-STATUS', r.done ? '0 (OK)' : '…']);
          o.res = ['cobranca_id: "c-7731" · status: "pendente"'];
          if (r.done) o.rows.L = PED(['c-7731 · pending', 'acc'], ['grpc-status: 0', 'dim']);
          if (r.run) T(o, 'tape', 'HEADERS · DATA · trailers', 'acc'); } },
      { id: 'hpack', dur: 5.5, pt: 1.1, title: 'From the 2nd call on: 103 B', yk: 'ON THE WIRE · the next call', rk: 'PER CALL',
        yaml: ['client: HEADERS 9 + 15 · DATA 9 + 16 = 49 B', 'server: HEADERS 9 + 2 · DATA 9 + 23', '          trailers 9 + 2 = 54 B', '# the HPACK table already holds the headers:', '# each one becomes 1 byte of index', '# the grpc-timeout changes: it goes in full'],
        ys: ['client: HEADERS 9 + 15', '         DATA 9 + 16 = 49 B', 'server: 9 + 2 · 9 + 23 · 9 + 2', '          = 54 B', '# HPACK: repeated header', '#   becomes 1 byte of index'],
        story: 'On the next call over the same connection, the headers almost disappear. HPACK keeps in a table, on both sides, what already went by: :path, content-type, user-agent each become 1 byte of index. The client\'s HEADERS drops from 102 to 15 bytes; only the grpc-timeout goes in full, because the remaining deadline changes on each call. The server\'s drops to 2.',
        look: 'The HPACK block lights up; the tape runs much shorter in both directions: 49 cells out and 54 back.',
        key: 'HPACK: a header that repeats becomes an index; from the 2nd call on, 103 B.',
        f(o, t) { const a = flow(o, t, 0.4, G2C), b = flow(o, t, 0.6 + fdur(49), G2S, -1);
          o.on.K = 1; o.rows.K = HPK(['headers already stored', 'acc'], ['index: 1 byte each', 'dim']);
          o.cnt = C3(['BYTES ON THE WIRE', B_(a.n + b.n, 103)], ['CLIENT', '49 B (HEADERS: 15)'], ['SERVER', '54 B (HEADERS: 2)']);
          o.res = ['49 + 54 = 103 B (on the 1st: 229 B)'];
          if (a.run) T(o, 'tape', 'out: 49 B', 'acc'); if (b.run) T(o, 'tape', 'back: 54 B', 'acc'); } },
      { id: 'conta', dur: 8, pt: 2.2, title: 'REST 360 B, gRPC 103 B', yk: 'THE MATH', rk: 'THE REAL GAIN',
        yaml: ['REST/HTTP/1.1:  210 + 150 = 360 B, every call', 'gRPC/HTTP/2:    229 B on the 1st, 103 B after', '360 ÷ 103 = 3.5× fewer bytes', '100 charges/s: 36 KB/s × 10.3 KB/s', '# the bigger gain: typed contract,', '# multiplexed calls and streaming'],
        ys: ['REST:  210 + 150 = 360 B', '       on every call', 'gRPC:  229 B on the 1st, 103 after', '360 ÷ 103 = 3.5×', '100 charges/s:', '  36 KB/s × 10.3 KB/s'],
        story: 'Side by side: the REST request goes with 210 bytes, the gRPC one with 49. Counting both ways, it is 360 bytes against 103, 3.5 times fewer. At 100 charges per second, 36 KB/s against 10.3 KB/s. For an internal call, that is little. What weighs most in gRPC\'s favor is the typed contract, the calls multiplexed on one connection and streaming.',
        look: 'First the REST request goes by, long; then the gRPC one, short. The display shows both sums.',
        key: 'In bytes gRPC wins by 3.5×; the bigger gain is the contract and the shared connection.',
        f(o, t) { const a = flow(o, t, 0.4, REQ), b = flow(o, t, 1 + fdur(210), G2C);
          o.cnt = C3([a.run || !b.n ? 'REST · OUT' : 'gRPC · OUT', a.run || !b.n ? B_(a.n, 210) : B_(b.n, 49)], ['REST, OUT AND BACK', '360 B always'], ['gRPC, OUT AND BACK', '229 B · then 103 B']);
          o.res = ['typed contract · multiplexing · streaming'];
          if (a.run) T(o, 'tape', 'REST: 210 B out', 'hi'); if (b.run) T(o, 'tape', 'gRPC: 49 B out', 'acc'); } },
      { id: 'l4', dur: 7, title: 'What if it fails: the layer 4 LB pins the connections', yk: 'LOAD BALANCING', rk: 'FIX',
        yaml: ['# pedidos: 3 replicas, 1 HTTP/2 connection each', '# the layer 4 LB (module 7) chooses', '#   the destination when the connection opens', '# after that, all calls go over it', 'pagamentos-1: 100% · pagamentos-2: 0%', '# fix: balance per call (L7)'],
        ys: ['# 3 replicas of pedidos,', '#   1 HTTP/2 connection each', '# the L4 LB chooses on connect', '# and the calls follow on it', 'pagamentos-1: 100%', 'pagamentos-2: 0%'],
        story: 'The pedidos has 3 replicas, and each one opens an HTTP/2 connection to the pagamentos and keeps it open. A layer 4 load balancer, like the one in module 7, picks the destination when the connection opens, and after that does not see the calls that pass inside it. All 3 connections landed on pagamentos-1: it gets everything, and pagamentos-2 stays at 0%.',
        look: 'Three lines leave the pedidos, pass through the LB and all go to pagamentos-1; pagamentos-2, in front, turns red and idle.',
        key: 'HTTP/2 keeps the connection; layer 4 balancing does not spread the calls.',
        f(o, t) { o.show.M = 1; o.show.F4 = 1; o.show.tape = 0;
          o.rows.L = R_('pedidos', '3 replicas', ['3 HTTP/2 connections', ''], ['opened and kept', 'dim']); o.rows.R = R_('pagamentos-1', 'replica', [t > 1 ? 'gets 100%' : '…', t > 1 ? 'acc' : 'dim']);
          o.rows.F4 = R_('pagamentos-2', 'replica', [t > 1.5 ? '0% · idle' : '…', 'bad']); if (t > 1.5) o.on.F4 = 'bad';
          [226, 246, 266].forEach((y, i) => {
            const ph = t > 2 ? ((t - 2 + i * 0.4) % 1.2) / 1.2 : clamp((t - 0.3 - i * 0.3) / 1.2);
            o.beams.push({ pts: [...LM(y), ...MR(y)], on: t > 0.3 + i * 0.3, dot: t > 0.3 + i * 0.3 ? ph : null }); });
          o.beams.push({ pts: M_F4 });
          o.cnt = C3(['pagamentos-1', t > 1 ? '100% of the calls' : '…'], ['pagamentos-2', t > 1.5 ? '0%' : '…', 'bad'], ['CONNECTIONS', '3, opened and kept']);
          o.res = t > 4 ? ['balance per call: L7,', 'mesh sidecar or in the client'] : [];
          if (t > 2.2) T(o, 'M', 'L4 sees connections, not calls', 'bad'); if (t > 4.2) T(o, 'F4', 'fix: balance per call\n(L7, sidecar or client)', 'acc'); } },
    ],
    proto: [
      { id: 'campos', dur: 5, title: 'The names do not travel: only the numbers', yk: 'ON THE WIRE · CobrancaRequest', rk: 'THE SAME IN JSON',
        yaml: ['message CobrancaRequest {', '  int64  pedido_id      = 1;', '  int64  valor_centavos = 2;', '  string meio           = 3;', '}', '08 9a 08 10 ca 16 1a 03 70 69 78  (11 B)'],
        story: 'These are the 11 bytes of order 1050 in Protobuf: 08 9a 08 10 ca 16 1a 03 70 69 78. The names pedido_id, valor_centavos and meio are nowhere. What travels is the number of each field, agreed in the .proto. Both sides read the same contract and know that field 1 is the order, 2 is the amount in cents and 3 is the payment method.',
        look: 'The tape stops and shows the 11 bytes large; under each one, its role. The .proto lights up in the back.',
        key: 'Protobuf sends field number and value; the names stay in the contract.',
        f(o, t) { o.on.K = t > 0.4 ? 1 : 0; o.tape = { big: PB.map((h, i) => ({ ch: h, sub: ['tag 1', '1050', '', 'tag 2', '2890', '', 'tag 3', '3 B', 'p', 'i', 'x'][i], role: [0, 3, 6].includes(i) ? 'f' : 'b', on: t > 0.6 })) };
          o.cnt = C3(['ORDER 1050', '11 B'], ['FIELD NAMES ON THE WIRE', '0'], ['FIELD NUMBERS', '1 · 2 · 3']);
          o.res = [BODY];
          if (t > 1.2) T(o, 'K', 'the contract says what\neach number is', 'acc'); } },
      { id: 'tag', dur: 5, title: '08: field 1, type varint', yk: 'THE TAG', rk: 'THE OTHER TAGS',
        yaml: ['tag = (field number << 3) | type', 'field 1, type 0 (varint):', '  1 << 3 | 0 = 8 = 0x08', 'field 2, varint:  2 << 3 | 0 = 0x10', 'field 3, length + bytes:', '  3 << 3 | 2 = 26 = 0x1a'],
        story: 'The first byte, 08, is a tag. It joins two things: the field number, shifted 3 bits to the left, and the value type in the low 3 bits. Field 1, type 0 (varint, an integer): 1 << 3 | 0 = 8. In the same way, 10 is field 2 and 1a is field 3 with type 2, "length and then the bytes".',
        look: 'The 08 lights up; then the 10 and the 1a, the other two tags.',
        key: 'Tag = field number << 3 | type; 08 is "field 1, varint".',
        f(o, t) { const on = t < 2.2 ? [0] : [0, 3, 6]; o.tape = { big: bigCells(on) };
          o.cnt = C3(['TAG', t < 2.2 ? '0x08' : '0x08 · 0x10 · 0x1a'], ['FIELD', t < 2.2 ? '1 (pedido_id)' : '1 · 2 · 3'], ['TYPE', t < 2.2 ? '0 = varint' : '0 · 0 · 2']);
          o.res = ['0x10 = field 2 · 0x1a = field 3']; } },
      { id: 'varint', dur: 6.5, title: '9a 08 = 1050 and ca 16 = 2890', yk: 'THE VARINT', rk: 'CHECK',
        yaml: ['1050 = 8 × 128 + 26', '  26 = 0x1a → with the "continues" bit:', '  0x1a | 0x80 = 0x9a, then 0x08', '2890 = 22 × 128 + 74', '  74 = 0x4a → 0x4a | 0x80 = 0xca', '  then 22 = 0x16'],
        story: 'Varint stores an integer in 7-bit pieces, the smallest first. 1050 is 8 × 128 + 26. The 26 goes first, 0x1a, with the top bit on to say "there is more": 0x9a. Then comes the 8: 0x08. The value 2890 is 22 × 128 + 74: 0xca and 0x16. A small number takes few bytes: 1050 and 2890 fit in 2 each.',
        look: 'The 9a 08 (1050) lights up and, afterwards, the ca 16 (2890).',
        key: 'Varint: 7 bits per byte, the top bit warns that more follows.',
        f(o, t) { const two = t > 3.2; o.tape = { big: bigCells(two ? [4, 5] : [1, 2]) };
          o.cnt = C3([two ? 'ca 16' : '9a 08', two ? '2890' : '1050'], ['MATH', two ? '22 × 128 + 74' : '8 × 128 + 26'], ['BYTES', '2']);
          o.res = [two ? '0x4a + 0x16 × 128 = 74 + 2816 = 2890' : '0x1a + 0x08 × 128 = 26 + 1024 = 1050']; } },
      { id: 'texto', dur: 5, title: '1a 03 70 69 78 = "pix"', yk: 'LENGTH + BYTES', rk: 'THE TEXT',
        yaml: ['1a  field 3, type 2 (length + bytes)', '03  length: 3 bytes', '70  p', '69  i', '78  x', '# text goes as UTF-8, no quotes'],
        story: 'Field 3 is text, so it comes with the length in front: 1a (field 3, type 2), 03 (it is 3 bytes) and the letters in UTF-8, 70 69 78, which are p, i, x. No quotes, no field name. Adding the three parts, the whole order is 3 + 3 + 5 = 11 bytes.',
        look: 'The last 5 light up: the tag, the length and the three letters.',
        key: 'Text in Protobuf: tag, length and the bytes, with no quotes or name.',
        f(o, t) { o.tape = { big: bigCells([6, 7, 8, 9, 10]) };
          o.cnt = C3(['FIELD 3', '"pix"'], ['LENGTH', '3 B'], ['THE WHOLE ORDER', '3 + 3 + 5 = 11 B']);
          o.res = ['70 69 78 = "pix" in UTF-8']; } },
      { id: 'tamanho', dur: 5, title: '11 bytes against 53', yk: 'SIDE BY SIDE', rk: 'THE RESPONSE',
        yaml: ['JSON:     53 B   {"pedido_id":1050,...}', 'Protobuf: 11 B   08 9a 08 10 ca 16 ...', '4.8× smaller', 'response: 44 B of JSON', '          18 B of Protobuf', '0a 06 "c-7731" 12 08 "pendente"'],
        story: 'Side by side, the same order: 53 bytes in JSON, 11 in Protobuf, 4.8 times smaller. The response shrinks too: 44 bytes of JSON, 18 of Protobuf. The difference comes from the names and quotes that do not travel, and from numbers stored in binary instead of text.',
        look: 'Two rows on the tape: on top, the 53 cells of JSON; below, the 11 of Protobuf.',
        key: 'The same data, 53 B in JSON and 11 B in Protobuf.',
        f(o, t) { o.tape = { rows: [text(BODY, 'b'), PB.map((h, i) => ({ ch: '', role: [0, 3, 6].includes(i) ? 'f' : 'b' }))] };
          o.cnt = C3(['JSON', '53 B'], ['PROTOBUF', '11 B'], ['SMALLER', '4.8×']);
          o.res = ['44 B of JSON · 18 B of Protobuf'];
          if (t > 0.5) { T(o, [407, 200, 30], 'JSON · 53 B', 'hi'); T(o, [300, 290, 12], 'Protobuf · 11 B', 'acc'); } } },
      { id: 'numero', dur: 7, title: 'What if it fails: the field number reused', yk: 'THE CONTRACT CHANGED', rk: 'FIX',
        yaml: ['// pagamentos v2:', 'message CobrancaRequest {', '  int64  pedido_id = 1;', '  double valor     = 2;  // reused the 2!', '  string meio      = 3;', '}'],
        ys: ['// pagamentos v2:', '  double valor = 2;  // reused the 2', '// the old pedidos sends:', '//   10 ca 16 (field 2, varint)', '// v2 expects 64 bits in field 2:', '//   becomes an unknown field'],
        story: 'The pagamentos team swaps valor_centavos for double valor and reuses the number 2. The pedidos, still on the old version, sends 10 ca 16: field 2, type varint. The new pagamentos expects a 64-bit double in field 2, does not recognize the type and stores the bytes as an unknown field. The value ends up 0, and the charge goes out for 0.00 with no error at all.',
        look: 'The 10 ca 16 turns red on the tape, the v2 .proto lights up red in the back and the pagamentos shows value 0.',
        key: 'Never reuse a field number; the old one becomes reserved.',
        f(o, t) { o.tape = { big: bigCells(t > 0.8 ? [3, 4, 5] : [], t > 0.8 ? 'bad' : '') };
          o.on.K = 'bad'; o.rows.K = R_('pagamentos.proto', 'v2', ['  int64  pedido_id = 1;', 'dim'], ['  double valor = 2;  // reused', 'bad'], ['  string meio = 3;', 'dim']);
          if (t > 2) { o.on.R = 'bad'; o.rows.R = PAG(['valor = 0', 'bad'], ['field 2: unknown', 'bad']); }
          o.cnt = C3(['THE PAGAMENTOS READS', t > 2 ? 'valor = 0' : '…', 'bad'], ['FIELD 2 ARRIVES AS', t > 2 ? 'unknown' : '…', 'bad'], ['VISIBLE ERROR', 'none', 'bad']);
          o.res = t > 3.5 ? ['reserved 2; and a new number', 'for the new field'] : [];
          if (t > 3.5) T(o, 'K', 'fix: reserved 2;\nnew number for the new field', 'acc'); } },
    ],
    graphql: [
      { id: 'consulta', dur: 5, pt: 1.5, title: 'A query of 131 bytes', yk: 'ON THE WIRE · POST /graphql', rk: 'THE QUERY',
        yaml: ['{', '  destaque: produto(id: 42) { nome preco foto }', '  carrinho { itens }', '  recomendado: recomendados(produto: 42) { id nome preco }', '  pedido(id: 1048) { status }', '}'],
        ys: ['{ destaque: produto(id: 42)', '    { nome preco foto }', '  carrinho { itens }', '  recomendado: recomendados(produto: 42)', '    { id nome preco }', '  pedido(id: 1048) { status } }'],
        story: 'The home screen of Lena\'s app, the same one from module 9, now as a single query: POST /graphql with 131 bytes. The app writes exactly the fields it wants: the cat\'s name, price and photo, the number of items in the cart, the recommendations and the status of order 1048. In module 9, the code of the bff-app decided the shape; here, the client decides.',
        look: 'The query goes along the tape, from the app to the graphql server.',
        key: 'GraphQL: the client writes the fields it wants, in a single call.',
        f(o, t) { const r = flow(o, t, 0.4, GQ);
          o.cnt = C3(['BYTES ARRIVED', B_(r.n, 131)], ['APP CALLS', '1'], ['ROUTE', 'POST /graphql']);
          o.res = ['4 fields from 4 services'];
          if (r.run) T(o, 'tape', 'query · 131 B', 'acc'); } },
      { id: 'resolvers', dur: 6, title: '4 resolvers fetch from 4 services', yk: 'RESOLVERS', rk: 'THE SAME SCHEMA SERVES',
        yaml: ['Query.produto      → catalogo', 'Query.carrinho     → carrinho', 'Query.recomendados → recomendacoes', 'Query.pedido       → pedidos', '# one function per field;', '# each one fetches its piece'],
        story: 'The server reads the query against the schema and calls one resolver per field: produto goes to the catalogo, carrinho to the carrinho, recomendados to the recomendacoes, pedido to the pedidos. These are the 4 calls that, without a BFF, the app made by itself: 4 of 120 ms, 480 ms and 180 KB. Now the app makes 1, and the same schema serves app, website and voice.',
        look: 'The graphql lights up and four lights go down to the four services in front, one per resolver.',
        key: 'Resolver: one function per field, which fetches the data where it lives.',
        f(o, t) { o.on.R = t > 0.3 ? 1 : 0; o.rows.R = R_('graphql', 'resolvers', ['produto · carrinho', 'acc'], ['recomendados · pedido', 'acc']);
          const lab = ['produto(42)', 'carrinho', 'recomendados(42)', 'pedido(1048)'], back = ['plush cat · 79.90', 'items: 1', 'blue mug', 'a caminho'];
          let n = 0; [1, 2, 3, 4].forEach((f, i) => { const a = 0.4 + i * 0.35; send(o, t, a, a + 0.9, RF(f), lab[i], 'hi', 0.1);
            if (send(o, t, a + 1.6, a + 2.4, rev(RF(f)), back[i], 'acc', 0.6)) n++; });
          o.cnt = C3(['RESOLVERS', '4'], ['RESPONSES', `${n} of 4`], ['APP CALLS', '1 (were 4 · 480 ms)']);
          o.res = ['app, website and voice'];
          if (t > 4.6) T(o, 'R', '4 resolvers, 1 query', 'acc'); } },
      { id: 'resposta', dur: 5.5, pt: 2, title: 'Only the requested fields come back', yk: 'ON THE WIRE · the response', rk: 'THE FORMAT',
        yaml: ['{"data": {', '  "destaque": {"nome":"gato de pelúcia","preco":79.90,"foto":"gato-320.webp"},', '  "carrinho": {"itens":1},', '  "recomendado": [{"id":7,"nome":"caneca azul","preco":19.90}],', '  "pedido": {"status":"a caminho"}', '}}'],
        ys: ['{"data": {', '  "destaque": {"nome":"gato de pelúcia",', '    "preco":79.90,"foto":"gato-320.webp"},', '  "carrinho": {"itens":1},', '  "recomendado": [{"id":7,...}],', '  "pedido": {"status":"a caminho"} }}'],
        story: 'The response has the exact shape of the query, inside "data": destaque, carrinho, recomendado and pedido, the same names as the bff-app response in module 9, and not one field more. It is 201 bytes; the "ú" in pelúcia takes 2 of them in UTF-8.',
        look: 'The response comes back along the tape, from the graphql to the app.',
        key: 'The response has the shape of the query: nothing more, nothing less.',
        f(o, t) { const r = flow(o, t, 0.4, GR, -1);
          o.cnt = C3(['BYTES BACK', B_(r.n, 201)], ['FIELDS', 'only the requested'], ['WHO CHOOSES THE SHAPE', 'the client']);
          o.res = ['the shape of the bff-app (module 9)'];
          if (r.done) o.rows.L = R_("Lena's app", 'home screen', ['screen ready', 'acc'], ['1 call', 'dim']);
          if (r.run) T(o, 'tape', 'response · 201 B', 'acc'); } },
      { id: 'n1', dur: 10, title: 'What if it fails: N+1, 21 calls', yk: 'THE QUERY', rk: 'WITH DATALOADER',
        yaml: ['{ produtos(first: 20) {', '    nome', '    estoque { quantidade }', '} }', '# naive resolver: 1 + 20 = 21 calls', '# DataLoader: batches → 1 + 1 = 2'],
        story: 'A query asks for 20 products and the stock of each. The stock resolver, written the naive way, runs once per product: 1 call to the catalogo and 20 to the estoque, 21 in all. That is the N+1 problem. With DataLoader, the 20 questions of the same instant become one, in a batch: 1 + 1 = 2. Other risks: a query that is too expensive, no HTTP cache on a single route and errors that come back with status 200.',
        look: 'The light goes to the catalogo once and to the estoque 20 times, and the counter reaches 21 in red. Then the DataLoader turns on and it is only 2.',
        key: 'N+1: one resolver per item multiplies the calls; the DataLoader batches them.',
        f(o, t) { o.rows.F1 = R_('catalogo', '', ['produtos(first: 20)', 'dim']); o.rows.F2 = R_('estoque', '', ['quantidade', 'dim']);
          o.show.F3 = o.show.F4 = 0; o.tape = null;
          const dl = t > 6.2; let n = 0;
          if (!dl) { send(o, t, 0.3, 0.9, RF(1), 'produtos(20)', 'hi', 0.2); if (t > 0.9) n = 1;
            for (let i = 0; i < 20; i++) { const a = 1.2 + i * 0.22; if (t > a + 0.2) n = 2 + i; if (t > a && t < a + 0.3) send(o, t, a, a + 0.2, RF(2), '', 'bad', 0.05); }
            if (t > 5.6) quiet(o, RF(1), RF(2)); if (n > 1) { o.on.F2 = 'bad'; o.rows.F2 = R_('estoque', '', [`${n - 1} calls`, 'bad']); } }
          else { send(o, t, 6.4, 7.0, RF(1), 'produtos(20)', 'hi', 0.2); if (send(o, t, 7.2, 7.9, RF(2), 'batch: 20 ids', 'acc', 1)) { o.rows.F2 = R_('estoque', '', ['1 batched call', 'acc']); }
            n = t > 7.9 ? 2 : t > 7.0 ? 1 : 0; }
          o.rows.R = R_('graphql', dl ? 'with DataLoader' : 'naive resolver', [dl ? 'batches per tick' : 'estoque: 1 per product', dl ? 'acc' : 'bad']);
          o.cnt = C3(['CALLS', String(n), !dl && n > 2 ? 'bad' : ''], ['TO THE ESTOQUE', dl ? (n > 1 ? '1 (batched)' : '0') : String(Math.max(0, n - 1)), dl ? 'acc' : 'bad'], ['DATALOADER', dl ? 'on' : 'off', dl ? 'acc' : 'bad']);
          o.res = dl && n === 2 ? ['1 + 1 = 2 calls (were 21)'] : !dl && n === 21 ? ['1 + 20 = 21 calls'] : [];
          if (!dl && t > 5.6) T(o, 'F2', '1 + 20 = 21', 'bad'); if (dl && t > 8) T(o, 'F2', 'DataLoader: 1 + 1 = 2', 'acc'); } },
    ],
    converge: [
      { id: 'fora', dur: 5, title: 'At the outside door: REST at the gw-loja', yk: 'ON THE WIRE · app → gw-loja', rk: 'WHY',
        yaml: ['POST /api/v1/pedidos HTTP/1.1', 'Host: api.loja.com.br', 'Authorization: Bearer eyJ…  (module 8)', 'Content-Type: application/json', '# body: the blue mug (product 7), Pix'],
        story: 'The final design of the store puts each protocol where it pays off. At the outside door, for the app, the website and partners, there is REST with JSON at the gw-loja from module 8: any language speaks it, the browser speaks it, and the contract is easy to understand. If the company wants, GraphQL takes the place of the bff-app.',
        look: 'The light leaves Davi\'s app and enters the gw-loja: the first arrow, REST/JSON.',
        key: 'From outside in: REST/JSON, which every client understands.',
        f(o, t) { send(o, t, 0.3, 1.3, LM(), 'POST /api/v1/pedidos', 'hi'); if (t > 1.3) o.on.M = 1;
          quiet(o, MR(), R_F4, F4F2);
          o.cnt = C3(['PROTOCOL', 'REST · JSON'], ['WHO USES IT', 'app · website · partner'], ['WHERE', 'gw-loja (module 8)']);
          o.res = ['simple to understand, every client speaks it'];
          if (t > 1.6) T(o, [271, 176, 26], 'REST/JSON', 'acc'); } },
      { id: 'traduz', dur: 5, title: 'The gateway translates to gRPC', yk: 'TRANSCODING', rk: 'BROWSER',
        yaml: ['# at the gw-loja (e.g. Envoy gRPC-JSON transcoder)', 'POST /api/v1/pedidos  →  Pedidos.Criar', 'JSON                  →  Protobuf', '# the app does not even know it is gRPC inside', '# the browser does not speak plain gRPC:', '#   it would need gRPC-Web'],
        ys: ['POST /api/v1/pedidos', '  → Pedidos.Criar', 'JSON → Protobuf', '# e.g. Envoy gRPC-JSON', '#   transcoder', '# browser: only gRPC-Web'],
        story: 'The gw-loja receives the JSON and passes it on in gRPC: the POST /api/v1/pedidos becomes Pedidos.Criar, and the JSON becomes Protobuf. This is called transcoding, and Envoy does it with the gRPC-JSON transcoder filter. The app never finds out. It is also why gRPC stays inside: the browser does not speak plain gRPC, only gRPC-Web.',
        look: 'The gw-loja lights up and the light continues to the pedidos already in gRPC: the second arrow changes its name.',
        key: 'The gateway translates outside REST into inside gRPC.',
        f(o, t) { o.beams.push({ pts: LM(), on: false }); o.on.M = 1; send(o, t, 0.6, 1.6, MR(), 'Pedidos.Criar · Protobuf', 'acc');
          quiet(o, R_F4, F4F2);
          o.cnt = C3(['IN', 'REST · JSON'], ['OUT', 'gRPC · Protobuf'], ['WHO TRANSLATES', 'the gw-loja']);
          o.res = ['browser: only gRPC-Web'];
          if (t > 1.8) { T(o, [271, 176, 26], 'REST/JSON', 'hi'); T(o, [544, 176, 26], 'gRPC', 'acc'); } } },
      { id: 'dentro', dur: 5, title: 'Inside: gRPC, with mTLS and per call', yk: 'SERVICE TO SERVICE', rk: 'WHY',
        yaml: ['Pagamentos.Cobrar(ctx, &CobrancaRequest{', '  PedidoId: 1050, ValorCentavos: 2890, Meio: "pix"})', '# 103 B per call on an open connection', '# balanced per call (module 10)', '# mTLS from the mesh (module 10)'],
        ys: ['Pagamentos.Cobrar', '  1050 · 2890 · "pix"', '# 103 B per call', '# balanced per call', '# mTLS from the mesh', '#   (module 10)'],
        story: 'Between services, gRPC: a typed contract in the .proto, 103 bytes per call on a connection that stays open, balanced per call and encrypted with the mesh mTLS from module 10. Where the team does not want to distribute .proto files, REST also works in here.',
        look: 'The light goes down from the pedidos to the pagamentos, in front: Pagamentos.Cobrar.',
        key: 'Service to service: gRPC, with a strong contract and light calls.',
        f(o, t) { o.beams.push({ pts: LM(), on: false }, { pts: MR(), on: false }); send(o, t, 0.4, 1.3, R_F4, 'Pagamentos.Cobrar · 103 B', 'acc'); quiet(o, F4F2);
          if (t > 1.3) o.on.F4 = 1;
          o.cnt = C3(['PROTOCOL', 'gRPC · Protobuf'], ['PER CALL', '103 B'], ['SECURITY', 'mTLS (module 10)']);
          o.res = ['strong contract, light'];
          if (t > 1.6) T(o, [760, 330, 12], 'gRPC · mTLS', 'acc'); } },
      { id: 'terceiro', dur: 7, title: 'To the PSP: outbound REST and a webhook back', yk: 'WITH THIRD PARTIES', rk: 'THE NOTICE',
        yaml: ['# outbound: the PSP REST API', 'POST /cobrancas  → 201 · c-7731 · 180 ms', '# back, at 14:05:23.43:', 'POST https://api.loja.com.br/webhooks/psp', 'X-PSP-Signature: t=1792000000,v1=068149…e13a', '{"evento_id":"ev-8812","tipo":"cobranca.paga",…}'],
        ys: ['outbound: POST /cobrancas', '  → c-7731 · 180 ms', 'back, 14:05:23.43:', '  POST /webhooks/psp', '  X-PSP-Signature: …e13a', 'event ev-8812 · 112 B'],
        story: 'Outward, with the PSP, the store speaks its language: outbound REST to create the charge, 180 ms over the internet. And when Davi pays the Pix, at 14:05:23.4, the PSP is the one to notify: at 14:05:23.43 it calls the store\'s webhook with the event ev-8812, signed with HMAC. The pagamentos checks the signature and answers 200 in ~30 ms.',
        look: 'The light goes from the pagamentos to the PSP and back; then the PSP lights up and calls the store along the bottom path: the webhook.',
        key: 'With third parties: REST to call, webhook to be notified.',
        f(o, t) { o.beams.push({ pts: LM(), on: false }, { pts: MR(), on: false }, { pts: R_F4, on: false });
          send(o, t, 0.3, 1.2, F4F2, 'POST /cobrancas · REST', 'hi', 0.2); send(o, t, 1.6, 2.4, rev(F4F2), '201 · c-7731 · 180 ms', 'acc', 0.3);
          if (t > 3.3) o.on.F2 = 1; if (send(o, t, 3.5, 4.6, HOOK, 'webhook · ev-8812 · 14:05:23.43', 'acc', 0.3)) { o.on.F4 = 1; o.rows.F4 = R_('pagamentos', '', ['HMAC ok · 200 in 30 ms', 'acc']); }
          o.cnt = C3(['OUTBOUND', 'REST · 180 ms'], ['INBOUND', t > 4.6 ? 'webhook · ev-8812' : '…'], ['RESPONSE TO THE PSP', t > 4.8 ? '200 in ~30 ms' : '…']);
          o.res = t > 4.6 ? ['cobranca.paga · c-7731 · 2890'] : [];
          if (t > 4.8) T(o, 'F2', 'webhook: the PSP notifies', 'acc'); } },
      { id: 'contrato', dur: 8, title: 'What if it fails: the .proto by email', yk: 'THE CONTRACT', rk: 'FIX',
        yaml: ['# pagamentos v2, sent by email:', '  double valor = 2;   // was int64 valor_centavos', '# pedidos, relatorios and bff-app', '#   update on different days', '# fix: 1 contract repository,', '#   versioned package (v1, v2), check in CI'],
        ys: ['# pagamentos v2 by email:', '  double valor = 2;', '# 3 clients update', '#   on different days', '# fix: single repo,', '#   v1/v2, check in CI'],
        story: 'The pagamentos contract goes around by email. Version 2 comes out, which changes field 2, and each client updates when it can: the pedidos, the relatorios and the bff-app break on different days, and each break becomes a separate incident. The fix: a single contract repository, the version in the package name (loja.pagamentos.v1, v2) and a compatibility check in CI that blocks the change.',
        look: 'The v2 .proto lights up red in the back; the three clients of the pagamentos turn red, one at a time.',
        key: 'A scattered contract breaks slowly; a single repository, versioning and CI hold the change.',
        f(o, t) { o.show.L = o.show.M = o.show.F2 = 0; o.show.K = o.show.F0 = o.show.F1 = 1; o.on.K = 'bad';
          o.rows.K = R_('pagamentos.proto', 'v2', ['by email, no version', 'bad'], ['  double valor = 2;', 'bad'], ['  // was valor_centavos', 'dim']);
          const br = [t > 1.4, t > 3.2, t > 5]; let n = br.filter(Boolean).length;
          [['R', R_F4], ['F0', F0F4], ['F1', F1F4]].forEach(([k, pts], i) => { o.beams.push({ pts, on: br[i], tone: br[i] ? 'bad' : '' });
            if (br[i]) { o.on[k] = 'bad'; o.rows[k] = R_(['pedidos', 'relatorios', 'bff-app'][i], '', ['broke with v2', 'bad']); } });
          o.cnt = C3(['BROKEN CLIENTS', `${n} of 3`, n ? 'bad' : ''], ['WHEN', 'on different days'], ['WHERE THE CONTRACT IS', 'in an email', 'bad']);
          o.res = t > 6 ? ['single repo · package v1/v2', 'compatibility check in CI'] : [];
          if (t > 6) T(o, 'K', 'fix: single repo,\nv1/v2 and check in CI', 'acc'); } },
    ],
  };
  // os 11 bytes grandes: liga os índices pedidos (tom bad opcional)
  function bigCells(on, tone = '') { return PB.map((h, i) => ({ ch: h, sub: ['tag 1', '1050', '', 'tag 2', '2890', '', 'tag 3', '3 B', 'p', 'i', 'x'][i],
    role: tone && on.includes(i) ? 'x' : [0, 3, 6].includes(i) ? 'f' : 'b', on: on.includes(i) })); }
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
  // tamanhos por tipo de peça: [nome, linhas, altura da linha do nome]
  const SIZES = { app: [14, 10.4, 14], k: [11.5, 9.2, 12], side: [11, 9.4, 0], f: [11, 9.6, 0] };
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const [s1, s2, lh] = SIZES[Bk.kind]; const nameC = () => on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi;
    x.textAlign = 'left'; x.fillStyle = nameC(); const name = d.name;
    if (Bk.kind === 'side') {   // uma linha: NOME · estado (a peça é rasa)
      const y = H_ / 2; fitFont(x, u, name, s1, 80); x.fillText(name, u(5), u(y)); const nw = x.measureText(name).width / cv.P;
      const [t2, tn] = d.rows[0]; x.fillStyle = toneC(tn); fitFont(x, u, t2, s2, W_ - nw - 16); x.fillText(t2, u(nw + 11), u(y + 0.4));
    } else if (Bk.kind === 'f') {   // duas linhas: nome (e o papel à direita), estado embaixo
      const y = H_ / 2; fitFont(x, u, name, s1, d.lang ? 80 : W_ - 10); x.fillText(name, u(5), u(y - 6));
      if (d.lang) { x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.textAlign = 'right'; x.fillText(d.lang, u(W_ - 5), u(y - 6)); x.textAlign = 'left'; }
      const [t2, tn] = d.rows[0] || ['']; x.fillStyle = toneC(tn); fitFont(x, u, t2, s2, W_ - 10); x.fillText(t2, u(5), u(y + 8));
    } else {
      let y = lh * 0.62; fitFont(x, u, name, s1, d.lang ? W_ - 90 : W_ - 10); x.fillText(name, u(5), u(y));
      if (d.lang) { x.fillStyle = INK(); x.textAlign = 'right'; fitFont(x, u, d.lang, 8.6, 84); x.fillText(d.lang, u(W_ - 5), u(y)); x.textAlign = 'left'; }
      y += lh * 0.5;
      for (const [text, tn] of d.rows) { const l2 = s2 * 1.4; y += l2 / 2; if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, s2, W_ - 10); x.fillText(text, u(5), u(y)); } y += l2 / 2; }
    }
    cv.tex.needsUpdate = true;
  }
  // a fita: casas de 1 byte que andam, os 11 bytes grandes, ou duas linhas lado a lado
  function cellStyle(role, light) {
    return {
      h: [light ? '#f8f8f7' : '#1d1f21', pal3().inkHi], c: [light ? '#f8f8f7' : '#1d1f21', INK()], r: [light ? '#eceef4' : '#1c1e27', pal3().inkHi],
      b: [light ? '#f6ece2' : '#2a1d12', accC()], f: [light ? '#dfe3e6' : '#1a2226', INK()], k: [light ? '#e6e2ea' : '#211c26', INK()],
      g: [light ? '#dfe3e6' : '#1a2226', INK()], x: [light ? '#f4e4e2' : '#24130f', BAD()],
    }[role];
  }
  let tapeKey = '';
  function drawTape(tp) {
    const key = JSON.stringify(tp && tp.cells ? [tp.n, tp.cells.length, tp.cells[0].role, tp.cells[0].ch, tp.cells[tp.cells.length - 1].ch] : tp || 0) + theme + accent.getHex();
    if (key === tapeKey) return; tapeKey = key;
    const cv = B.tape.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', Wd = cv.c.width / P, Hd = cv.c.height / P;
    x.fillStyle = C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textAlign = 'center'; x.textBaseline = 'middle';
    const cell = (cx, cy, w, h, c, fs, sub, hot) => { const [bg, fg] = cellStyle(c.role, light), ring = c.on || hot;
      x.fillStyle = bg; x.fillRect(u(cx), u(cy), u(w), u(h)); x.strokeStyle = ring ? (c.role === 'x' ? BAD() : accC()) : C.line; x.lineWidth = u(ring ? 1.2 : 0.35); x.strokeRect(u(cx), u(cy), u(w), u(h));
      if (c.ch) { x.fillStyle = fg; const f = c.ch.length > 1 ? fs * 0.86 : fs; x.font = `700 ${u(f)}px ${MONO3}`; x.fillText(c.ch, u(cx + w / 2), u(cy + h / 2 + 0.4)); }
      if (sub) { x.fillStyle = c.on ? (c.role === 'x' ? BAD() : accC()) : INK(); x.font = `700 ${u(9.5)}px ${MONO3}`; x.fillText(sub, u(cx + w / 2), u(cy + h + 9)); } };
    const x0 = (Wd - COLS * CW) / 2, at = i => [x0 + (i % COLS) * CW, 4 + Math.floor(i / COLS) * CH];
    if (tp && tp.big) { const w = 30, bx = (Wd - w * 11) / 2; tp.big.forEach((c, i) => cell(bx + i * w + 1, 22, w - 2, 40, c, 18, c.sub)); }
    else if (tp && tp.rows) { tp.rows[0].forEach((c, i) => { const [cx, cy] = at(i); cell(cx + 0.3, cy, CW - 0.6, CH - 1.4, c, 10.6); });
      tp.rows[1].forEach((c, i) => { const [cx, cy] = at(i + 3 * COLS); cell(cx + 0.3, cy, CW - 0.6, CH - 1.4, c, 9.4); });
 }
    else if (tp && tp.cells) { for (let i = 0; i < tp.n; i++) { const [cx, cy] = at(i); cell(cx + 0.3, cy, CW - 0.6, CH - 1.4, tp.cells[i], 10.6, '', i === tp.n - 1 && tp.n < tp.cells.length); } }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.ys || s.yaml;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 220) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 12 + i * 44; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 19, 220); x.fillText(val, u(10), u(Y + 18)); });
    const L0 = 252; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(137)); x.stroke();
    lbl(s.yk, L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(25 + i * 12.6)); });
    lbl(s.rk || 'RESPONSE', L0, 104);
    x.fillStyle = o.res.length ? acc : INK(); (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { if (/^(5|4)\d\d|^error|nothing comes back/.test(l)) x.fillStyle = BAD(); fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(117 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    rest: () => `<table class="h3-sum"><tr><th></th><th>headers</th><th>body</th><th>total</th></tr><tr><td>order</td><td>157 B</td><td>53 B</td><td><b>210 B</b></td></tr><tr><td>202 response</td><td>106 B</td><td>44 B</td><td><b>150 B</b></td></tr><tr class="on"><td>per call</td><td>263 B</td><td>97 B</td><td><b>360 B</b></td></tr></table>
      <li>Chain of order 1050: gw → pedidos <b>5 ms</b>, stock reservation <b>20 ms</b>, pedidos → pagamentos <b>5 ms</b>, pagamentos → PSP <b>180 ms</b>: <b>210 ms</b>.</li><li>In series, 3 services at 99.9% each: 0.999³ = <b>99.70%</b>, <b>129 min/month</b> down (a single one: 43 min). With 4 hops, 99.60% and 173 min.</li><li>POST and PATCH are not idempotent; GET, HEAD, PUT and DELETE are (RFC 9110). Fix for a repeated POST: <b>Idempotency-Key</b> (IETF draft) or PUT with an id generated by the client.</li><li class="h3-dim">HTTP/1.1 without TLS; with the mesh mTLS the bytes are the same, encrypted. The timings are examples.</li>`,
    rpc: () => `<li>The call: <b>Frete.Calcular(Args{Cep: "50050-000", PesoKg: 0.4})</b> → <b>15.00</b>, in the entregas service.</li><li>Path: code → <b>stub</b> (serializes) → network → <b>skeleton</b> (deserializes and calls) → function, and the same on the way back.</li><li>Lab: <b>Proteinas.Recomendacao</b>, port <b>1234</b>, Peso 85 → <b>170 g/day</b>; the client calls with no deadline at all.</li><li>net/rpc: encodes in <b>gob</b>, only talks to Go, <b>frozen</b> package. JSON-RPC 2.0: the same call in <b>93 B</b>.</li><li class="h3-dim">The tape shows the content of the gob message, not the bytes one by one.</li>`,
    grpc: () => `<table class="h3-sum"><tr><th>frames</th><th>1st call</th><th>2nd on</th></tr><tr><td>client HEADERS</td><td>9 + 102</td><td>9 + 15</td></tr><tr><td>client DATA</td><td>9 + 16</td><td>9 + 16</td></tr><tr><td>server HEADERS</td><td>9 + 19</td><td>9 + 2</td></tr><tr><td>server DATA</td><td>9 + 23</td><td>9 + 23</td></tr><tr><td>trailers</td><td>9 + 24</td><td>9 + 2</td></tr><tr class="on"><td>total</td><td><b>136 + 93 = 229 B</b></td><td><b>49 + 54 = 103 B</b></td></tr></table>
      <li>REST: <b>360 B</b> on every call. 360 ÷ 103 = <b>3.5×</b>. At 100 charges/s: 36 KB/s × 10.3 KB/s.</li><li>DATA = 5 B of gRPC prefix (1 for "compressed?" + 4 for length) + Protobuf: 11 B out, 18 back.</li><li>grpc-go headers: :method, :scheme, :path, :authority, content-type <b>application/grpc+proto</b>, user-agent <b>grpc-go/1.62.1</b>, te: trailers, grpc-timeout (remaining microseconds, changes on every call). Trailers: <b>grpc-status: 0</b> and an empty grpc-message.</li><li class="h3-dim">Measured with grpc-go 1.62.1 and a proxy that reads the frames, on loopback (:authority of 15 B; with pagamentos:50051, 1 B more). Left out of the math: the preface (24 B) and the SETTINGS (42 B) of the new connection, and grpc-go's PING and WINDOW_UPDATE. The 2nd call came out at 102 B; from the 3rd on, 103.</li>`,
    proto: () => `<table class="h3-sum"><tr><th>bytes</th><th>what it is</th></tr><tr><td>08</td><td>field 1, varint (1 &lt;&lt; 3 | 0)</td></tr><tr><td>9a 08</td><td>1050 = 8 × 128 + 26</td></tr><tr><td>10</td><td>field 2, varint</td></tr><tr><td>ca 16</td><td>2890 = 22 × 128 + 74</td></tr><tr><td>1a</td><td>field 3, length + bytes (3 &lt;&lt; 3 | 2)</td></tr><tr><td>03 70 69 78</td><td>3 bytes: "pix"</td></tr></table>
      <li>JSON <b>53 B</b> → Protobuf <b>11 B</b> (4.8× smaller). Response: 44 B → <b>18 B</b> (0a 06 "c-7731" 12 08 "pendente").</li><li>Rule: never reuse a field number; what leaves becomes <b>reserved</b>. Money in <b>int64</b> of cents, not double.</li>`,
    graphql: () => `<li>Query: <b>131 B</b> in POST /graphql; response: <b>201 B</b> with destaque, carrinho, recomendado and pedido (the shape of the bff-app).</li><li>Without a BFF: 4 calls of 120 ms = 480 ms and 180 KB. With GraphQL: 1 call from the app.</li><li><b>N+1</b>: produtos(first: 20) with stock → 1 + 20 = <b>21</b> calls; with DataLoader, <b>2</b>.</li><li>Other risks: an expensive query (10 items × 5 levels = 100,000 nodes → depth and cost limits); a single route does not use the HTTP cache or ETag; errors come back with <b>status 200</b> and errors[] in the body.</li>`,
    converge: () => `<table class="h3-sum"><tr><th>where</th><th>protocol</th><th>why</th></tr><tr><td>app, website, partner</td><td>REST/JSON (gw-loja)</td><td>every client speaks it</td></tr><tr><td>different shapes of the data</td><td>GraphQL</td><td>the client chooses</td></tr><tr class="on"><td>service to service</td><td>gRPC + mTLS</td><td>strong contract, 103 B</td></tr><tr><td>real time</td><td>WebSocket or SSE</td><td>the server pushes</td></tr><tr><td>third parties</td><td>outbound REST, inbound webhook</td><td>the PSP's language</td></tr></table>
      <li>The gw-loja translates <b>POST /api/v1/pedidos</b> into <b>Pedidos.Criar</b> (e.g. Envoy gRPC-JSON transcoder). The browser only speaks gRPC-Web.</li><li>PSP webhook at <b>14:05:23.43</b>: event <b>ev-8812</b>, HMAC-SHA256 signature, 200 response in ~30 ms.</li><li>Contracts: a single repository, the version in the package (<b>v1</b>, <b>v2</b>), a compatibility check in CI.</li>`,
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
      <div class="i3-count" id="c3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk)}</b>${esc(s.yaml.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'chamada') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'chamada' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-chamada3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'chamada') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  const inRect = (b, p, m = 3) => p[0] > b.x - m && p[0] < b.x + b.w + m && p[1] > b.y - m && p[1] < b.y + b.d + m;
  function scene3(dt) {
    const o = SP = spec();
    // a peça acende quando a luz passa por ela
    NAMES.forEach(nm => { if (!o.on[nm] && o.show[nm] && nm !== 'tape' && o.dots.some(p => inRect(B[nm], p))) o.on[nm] = 1; });
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.y, PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0;
      if (Bk.g.visible) { if (nm === 'tape') drawTape(o.tape); else if (o.rows[nm]) drawBlock(Bk, o.rows[nm], on); }   // a peça que afunda guarda o último desenho
      Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : nm === 'tape' && o.tape && o.tape.cells ? 0.25 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.y + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && nm !== 'tape' ? 0.7 : 0); });
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 46); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    if (POSTER && cur().pt != null) lt = cur().pt;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('c3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 815, 8, 425];
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
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
    for (const k in ckey) delete ckey[k]; tapeKey = ''; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 220, -150), dist: innerWidth < 640 ? 14 : 17 } : { target: W(150, 220, 60), dist: 15.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–6 · drag to rotate' };
})() });
