// Figura 3D (iso-glow): a mesma chamada de várias formas. O pedidos cobra o pedido 1050 do Davi (caneca azul 19.90 + frete 9.00 = 28.90,
// 2890 centavos, Pix) no pagamentos. Entre os dois, o fio é uma fita: cada casa é 1 byte, e o pedido anda por ela como bytes de verdade
// (as letras do HTTP/1.1, os quadros do HTTP/2 com os 11 bytes do Protobuf).
// Cena: ao fundo, o mostrador (contadores, o que está no fio, a resposta) e um bloco de contrato (net/rpc, tabela HPACK, .proto, schema).
// Na frente: quem chama à esquerda, quem responde à direita, a fita no meio; stub e skeleton colados na frente (RPC);
// uma fileira de serviços na beira da prancha (PSP, resolvers do GraphQL, o desenho final).
// Cenários (toggle e ?mode=rest|rpc|grpc|proto|graphql|converge; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-sincrona-brief.md). Bytes do gRPC medidos com grpc-go 1.62.1
// e um proxy que lê os quadros (docs/escrita/comunicacao-sincrona-medida-grpc/).
FIGS3D.push({ id: 'chamada', name: 'Comunicação síncrona', mod: (() => {
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
  const SCNAME = { rest: 'REST', rpc: 'RPC', grpc: 'gRPC', proto: 'Proto', graphql: 'GraphQL', converge: 'Juntos' };
  const SCFULL = { rest: 'REST: HTTP/1.1 e JSON', rpc: 'RPC: stub, rede, skeleton', grpc: 'gRPC: HTTP/2 e quadros',
    proto: 'Protobuf: os 11 bytes', graphql: 'GraphQL: o cliente escolhe', converge: 'Cada protocolo no seu lugar' };
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
  const PED = (...r) => R_('pedidos', 'Go', ...(r.length ? r : [['pedido 1050 · 28.90'], ['Pix · 2890 centavos', 'dim']]));
  const PAG = (...r) => R_('pagamentos', 'Go', ...(r.length ? r : [['POST /cobrancas', 'dim'], ['cria a cobrança no PSP', 'dim']]));
  const PSP = (...r) => R_('PSP', 'externo', ...(r.length ? r : [['provedor do Pix', 'dim']]));
  const SHOW = {
    rest: ['L', 'R', 'tape', 'F4'], rpc: ['L', 'R', 'tape', 'stub', 'skel', 'K'], grpc: ['L', 'R', 'tape', 'K'], proto: ['L', 'R', 'tape', 'K'],
    graphql: ['L', 'R', 'tape', 'K', 'F1', 'F2', 'F3', 'F4'], converge: ['L', 'M', 'R', 'F2', 'F4'],
  };
  const HPK = (...r) => R_('HPACK', 'tabela dinâmica', ...(r.length ? r : [['vazia: conexão nova', 'dim']]));
  const PROTO = (...r) => R_('pagamentos.proto', 'v1', ...(r.length ? r : [['message CobrancaRequest {', 'dim'], ['  int64 pedido_id = 1;'], ['  int64 valor_centavos = 2;'], ['  string meio = 3; }']]));
  const SCHEMA = R_('schema', 'SDL', ['type Produto { id nome preco }', 'dim'], ['type Query { produto', 'dim'], ['  recomendados carrinho pedido }', 'dim'], ['type Mutation { criarPedido }', 'dim']);
  const ROWS = {
    rest: () => ({ L: PED(), R: PAG(), F4: PSP() }),
    rpc: () => ({ L: PED(['frete.Calcular(...)'], ['parece uma função local', 'dim']), R: R_('entregas', 'Go', ['func Calcular(args, reply)'], ['frete para o CEP', 'dim']),
      stub: R_('STUB', '', ['finge ser o entregas', 'dim']), skel: R_('SKELETON', '', ['chama a função de verdade', 'dim']),
      K: R_('net/rpc', 'Go', ['codifica em gob', 'dim'], ['sem .proto, sem schema', 'dim'], ['cliente e servidor em Go', 'dim']) }),
    grpc: () => ({ L: PED(['Pagamentos.Cobrar(ctx, req)'], ['deadline: 1 s', 'dim']), R: PAG(['rpc Cobrar', 'dim'], ['porta 50051 · HTTP/2', 'dim']), K: HPK(),
      M: R_('LB camada 4', '', ['balanceia conexões', 'dim']), F4: R_('pagamentos-2', 'réplica', ['esperando', 'dim']) }),
    proto: () => ({ L: PED(['CobrancaRequest'], ['1050 · 2890 · "pix"', 'dim']), R: PAG(['lê pelo .proto', 'dim'], ['campo 1, 2, 3', 'dim']), K: PROTO() }),
    graphql: () => ({ L: R_('app da Lena', 'tela inicial', ['1 consulta', 'dim'], ['escolhe os campos', 'dim']),
      R: R_('graphql', 'no lugar do bff-app', ['POST /graphql', 'dim'], ['1 resolver por campo', 'dim']), K: SCHEMA,
      F1: R_('catalogo', '', ['destaque', 'dim']), F2: R_('carrinho', '', ['carrinho', 'dim']),
      F3: R_('recomendacoes', '', ['recomendado', 'dim']), F4: R_('pedidos', '', ['pedido 1048', 'dim']) }),
    converge: () => ({ L: R_('app do Davi', 'celular', ['pedido 1050', 'dim'], ['site e parceiro também', 'dim']), M: R_('gw-loja', 'gateway', ['REST fora', 'dim'], ['gRPC dentro', 'dim']),
      R: PED(['Pedidos.Criar', 'dim'], ['gRPC · mTLS', 'dim']), F4: R_('pagamentos', '', ['Pagamentos.Cobrar', 'dim']), F2: R_('PSP', 'externo', ['REST de saída', 'dim']),
      F0: R_('relatorios', '', ['cliente do .proto', 'dim']), F1: R_('bff-app', '', ['cliente do .proto', 'dim']),
      K: R_('pagamentos.proto', 'v2', ['por e-mail, sem versão', 'bad']) }),
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
  const B_ = (n, N) => `${n} de ${N} B`;

  const STEPS = {
    rest: [
      { id: 'espera', dur: 6, title: 'O pedidos chama e espera', yk: 'NO CÓDIGO · pedidos (Go)', rk: 'RESPOSTA',
        yaml: ['res, err := http.Post(', '  "http://pagamentos:8080/cobrancas",', '  "application/json", body)', '// a goroutine para aqui até a', '// resposta (ou o erro) voltar'],
        story: 'O Davi fechou o pedido 1050: a caneca azul (19.90) mais o frete de SP (9.00), 28.90, que viram 2890 centavos num Pix. O pedidos chama o pagamentos, o pagamentos chama o PSP, e cada um fica parado até a resposta voltar. Isso é uma chamada síncrona: simples de seguir, e quem chama herda a demora de todos os de trás.',
        look: 'A luz vai do pedidos ao pagamentos, desce até o PSP e só depois volta. O relógio do pedidos corre o tempo todo.',
        key: 'Chamada síncrona: quem chama para e espera; o tempo de quem está atrás passa a ser dele.',
        f(o, t) { const ms = Math.round(clamp((t - 0.3) / 4.4) * 185);
          send(o, t, 0.3, 1.0, TAPE, 'POST /cobrancas', 'hi', 0.2); send(o, t, 1.0, 1.6, R_F4, 'cobrança Pix · 28.90', 'hi', 1.6);
          if (t > 1.6 && t < 3.4) { o.on.F4 = 1; o.rows.F4 = PSP(['processando · 180 ms']); }
          send(o, t, 3.4, 4.0, rev(R_F4), 'c-7731', 'acc', 0.2);
          if (send(o, t, 4.0, 4.7, rev(TAPE), '202 Accepted', 'acc')) o.res = ['202 Accepted · 185 ms', RBODY];
          if (t > 0.3) { o.on.L = 2; o.rows.L = PED(['esperando a resposta…', t > 4.7 ? 'dim' : 'acc'], [`${ms} ms parado`, 'dim']); }
          o.cnt = C3(['O PEDIDOS ESPERA', ms + ' ms'], ['ATÉ O PAGAMENTOS', '5 ms'], ['DO PAGAMENTOS AO PSP', '180 ms (internet)']);
          if (t > 4.9) T(o, 'L', '185 ms parado: 5 + 180', 'acc'); } },
      { id: 'pedido', dur: 5, pt: 3.2, title: 'O pedido vira 210 bytes no fio', yk: 'NO FIO · HTTP/1.1 (texto)', rk: 'CORPO · 53 B',
        yaml: REQH.split('\r\n').filter(Boolean).concat(['', BODY]), ys: REQH.split('\r\n').filter(Boolean),
        story: 'É isso que o pedidos manda, letra por letra: uma linha com o método e o caminho, cinco cabeçalhos e uma linha em branco, que somam 157 bytes, e depois o corpo em JSON, com 53. Em HTTP/1.1 sem TLS é texto puro: dá para ler cada byte. Com o mTLS da malha (módulo 10) os bytes são os mesmos, só que cifrados.',
        look: 'A fita entre os dois é o fio, e cada casa dela é 1 byte. Passam 157 casas de cabeçalho e, por último, as 53 do corpo, acesas.',
        key: 'Em HTTP/1.1 o pedido é texto: 157 B de cabeçalhos mais 53 B de corpo, 210 B.',
        f(o, t) { const r = flow(o, t, 0.4, REQ);
          o.cnt = C3(['BYTES QUE CHEGARAM', B_(r.n, 210)], ['CABEÇALHOS', '157 B'], ['CORPO (JSON)', '53 B']);
          o.res = [BODY];
          if (r.run) T(o, 'tape', 'POST /cobrancas · 210 B', 'acc'); if (r.done) T(o, 'R', '210 B recebidos', 'acc'); } },
      { id: 'resposta', dur: 5, pt: 1.8, title: '202 Accepted: 150 bytes de volta', yk: 'NO FIO · a resposta', rk: 'CORPO · 44 B',
        yaml: RESH.split('\r\n').filter(Boolean).concat(['', RBODY]), ys: RESH.split('\r\n').filter(Boolean),
        story: 'O pagamentos responde 202 Accepted: a cobrança c-7731 foi aceita, mas ainda está pendente, porque o Davi não pagou o Pix. O cabeçalho Location diz onde consultar a cobrança depois. São 106 bytes de cabeçalho e 44 de corpo. Ida e volta, a chamada custou 360 bytes, e 263 deles são cabeçalho.',
        look: 'Agora a fita corre ao contrário: do pagamentos para o pedidos, 150 casas.',
        key: '202 quer dizer "aceitei, mas ainda não terminei"; a chamada inteira custou 360 B.',
        f(o, t) { const r = flow(o, t, 0.4, RES, -1);
          o.cnt = C3(['BYTES DE VOLTA', B_(r.n, 150)], ['A CHAMADA INTEIRA', '210 + 150 = 360 B'], ['SÓ DE CABEÇALHO', '157 + 106 = 263 B']);
          o.res = [RBODY]; if (r.done) o.rows.L = PED(['cobrança c-7731'], ['status: pendente', 'dim']);
          if (r.run) T(o, 'tape', '202 Accepted · 150 B', 'acc'); if (r.done) T(o, 'L', 'c-7731 · pendente', 'acc'); } },
      { id: 'repete', dur: 5.6, pt: 2.3, title: 'A próxima chamada manda tudo de novo', yk: 'NO FIO · a próxima cobrança', rk: 'O QUE MUDA',
        yaml: REQH.split('\r\n').filter(Boolean).concat(['', '{… outro pedido: o corpo muda …}']), ys: REQH.split('\r\n').filter(Boolean),
        story: 'Vem a próxima cobrança, de outro pedido. O corpo muda, mas os 157 bytes de cabeçalho saem iguais, letra por letra: Host, User-Agent, Accept, Content-Type. O HTTP/1.1 não lembra nada da chamada anterior, nem quando reaproveita a mesma conexão TCP. Em cada chamada vão de novo os 360 bytes.',
        look: 'As 157 casas de cabeçalho passam de novo, marcadas como repetidas; só as 53 do corpo são novas.',
        key: 'Em HTTP/1.1 os cabeçalhos viajam inteiros em toda chamada.',
        f(o, t) { const r = flow(o, t, 0.4, REQ2);
          o.cnt = C3(['BYTES QUE CHEGARAM', B_(r.n, 210)], ['REPETIDOS DA ANTERIOR', '157 B'], ['2 CHAMADAS', '2 × 360 = 720 B']);
          o.res = ['só o corpo: 53 B novos'];
          if (r.run) T(o, 'tape', '157 B iguais aos da anterior', 'acc'); if (r.done) T(o, 'R', 'mesmos cabeçalhos, de novo', 'acc'); } },
      { id: 'timeout', dur: 7, title: 'E se der errado: o PSP demora 8 s', yk: 'NO CÓDIGO · pagamentos', rk: 'RESPOSTA',
        yaml: ['ctx, cancel := context.WithTimeout(', '  ctx, 2*time.Second)  // módulo 10', 'res, err := psp.Cobrar(ctx, 2890)', '// err: context deadline exceeded', '// mas a c-7731 já existe no PSP'],
        story: 'Agora o PSP fica lento e leva 8 s para responder. O pagamentos espera no máximo 2 s (o timeout do módulo 10), desiste e devolve erro; o pedidos avisa o Davi que não deu certo. Só que, no PSP, a cobrança c-7731 já tinha sido criada. O Davi pode pagar o Pix de um pedido que a loja deu como falho: quem chamou não sabe se o outro lado fez ou não.',
        look: 'O PSP fica vermelho e o relógio do pagamentos para em 2.000 ms; o erro volta, e depois o PSP acende com a c-7731 criada.',
        key: 'Timeout não desfaz nada: quem chamou não sabe se o outro lado terminou.',
        f(o, t) { const ms = t < 1.2 ? 0 : Math.min(2000, Math.round((t - 1.2) / 2.2 * 2000));
          send(o, t, 0.3, 0.8, TAPE, 'POST /cobrancas', 'hi', 0.2); send(o, t, 0.8, 1.2, R_F4, 'cobrança Pix · 28.90', 'hi', 5);
          if (t > 1.2) { o.on.F4 = 'bad'; o.rows.F4 = PSP([t > 5.6 ? 'c-7731 criada' : 'lento: 8 s', 'bad']); }
          if (t > 1.2) o.rows.R = PAG([`esperando o PSP: ${ms} ms`, ms >= 2000 ? 'bad' : 'acc'], ['timeout: 2 s', 'dim']);
          if (send(o, t, 3.5, 4.2, rev(TAPE), 'erro: timeout de 2 s', 'bad')) { o.res = ['erro · context deadline exceeded', 'o Davi vê: "não deu certo"']; o.on.L = 'bad'; o.rows.L = PED(['pedido 1050 · falhou', 'bad'], ['avisou o Davi', 'dim']); }
          o.cnt = C3(['O PAGAMENTOS ESPERA', ms + ' ms', ms >= 2000 ? 'bad' : ''], ['TIMEOUT', '2 s'], ['NO PSP', t > 5.6 ? 'c-7731 existe' : '…', 'bad']);
          if (t > 5.6) T(o, 'F4', 'a cobrança existe:\no Davi pode pagar', 'bad'); } },
      { id: 'duplica', dur: 7.5, title: 'E se der errado: repetir o POST cria dois pedidos', yk: 'NO FIO · app → pedidos', rk: 'RESPOSTA',
        yaml: ['POST /api/v1/pedidos HTTP/1.1', 'Content-Type: application/json', '# corpo: a caneca azul (produto 7), Pix', '# a resposta demora; o app tenta de novo', '# conserto: Idempotency-Key: 3f9a…'],
        ys: ['POST /api/v1/pedidos HTTP/1.1', '# a resposta demora:', '#   o app manda o mesmo POST de novo', '# POST não é idempotente', '# conserto:', 'Idempotency-Key: 3f9a…'],
        story: 'Um passo para trás: agora quem chama é o app do Davi, e quem responde é o pedidos. O app manda POST /api/v1/pedidos, a resposta demora e o app tenta de novo. O POST não é idempotente: o pedidos cria o 1050 e mais um, e saem duas cobranças de 28.90. É por isso que a malha do módulo 10 só repete operações idempotentes.',
        look: 'O app manda o mesmo POST duas vezes; o pedidos fica vermelho com dois pedidos, e o PSP com duas cobranças.',
        key: 'POST repetido cria de novo; um Idempotency-Key faz o servidor devolver a mesma resposta.',
        f(o, t) { o.rows.L = R_('app do Davi', 'celular', ['POST /api/v1/pedidos'], [t > 2.4 ? 'sem resposta: de novo' : 'esperando…', t > 2.4 ? 'bad' : 'dim']);
          let n = 0, c = 0; if (t > 1.1) n = 1; if (t > 3.1) n = 2;
          send(o, t, 0.3, 1.1, TAPE, 'POST /api/v1/pedidos', 'hi', 0.2); send(o, t, 2.4, 3.1, TAPE, 'o mesmo POST, de novo', 'bad', 0.2);
          if (t > 1.6) c = 1; if (t > 3.6) c = 2;
          send(o, t, 1.1, 1.6, R_F4, '28.90', 'hi', 0.2); send(o, t, 3.1, 3.6, R_F4, '28.90 de novo', 'bad', 0.2);
          o.rows.R = PED([n ? 'pedido 1050 · 28.90' : '…', n ? '' : 'dim'], [n > 1 ? 'outro pedido · 28.90' : '', 'bad']);
          if (n > 1) o.on.R = 'bad'; if (c) o.rows.F4 = PSP([`${c} cobrança${c > 1 ? 's' : ''} de 28.90`, c > 1 ? 'bad' : '']); if (c > 1) o.on.F4 = 'bad';
          if (send(o, t, 4.2, 5.0, rev(TAPE), '201 · 201', 'acc', 0.3)) o.res = ['201 Created · pedido 1050', '201 Created · outro pedido'];
          o.cnt = C3(['POSTS ENVIADOS', String(n)], ['PEDIDOS CRIADOS', String(n), n > 1 ? 'bad' : ''], ['COBRANÇAS DE 28.90', String(c), c > 1 ? 'bad' : '']);
          if (t > 5.2) { T(o, 'R', 'dois pedidos para um clique', 'bad'); T(o, 'L', 'conserto: Idempotency-Key: 3f9a…', 'acc'); } } },
    ],
    rpc: [
      { id: 'local', dur: 5, title: 'Parece uma função local', yk: 'NO CÓDIGO · pedidos (Go)', rk: 'O QUE O CÓDIGO VÊ',
        yaml: ['var frete float64', 'err := client.Call("Frete.Calcular",', '  Args{Cep: "50050-000", PesoKg: 0.4},', '  &frete)', '// parece local: chama e espera'],
        story: 'O REST nomeia coisas, como /pedidos/1050. O RPC nomeia ações: o pedidos quer o frete da caneca para Recife e escreve Frete.Calcular com o CEP 50050-000 e 0,4 kg, como se a função estivesse ali. Não está: ela roda no serviço entregas, em outra máquina. Quem recebe a chamada no pedidos é um stub, um dublê da função.',
        look: 'O pedidos acende e a luz entra no STUB, colado na frente dele. O entregas, do outro lado, ainda nem soube.',
        key: 'RPC: chamar um procedimento em outra máquina como se fosse local (Birrell e Nelson, 1984).',
        f(o, t) { if (t > 0.3) o.on.L = 1; if (t > 1.2) { o.on.stub = 1; o.rows.stub = R_('STUB', '', ['recebeu Frete.Calcular', 'acc']); }
          send(o, t, 0.3, 1.2, [[127, YF, Z], [127, 314, Z]], '', 'hi', 3);
          o.cnt = C3(['A CHAMADA', 'Frete.Calcular'], ['ARGUMENTOS', '50050-000 · 0,4 kg'], ['ONDE RODA', 'no entregas']);
          o.res = t > 1.2 ? ['o stub pegou a chamada'] : [];
          if (t > 1.6) T(o, 'stub', 'o stub finge ser o entregas'); } },
      { id: 'stub', dur: 5.5, pt: 1.2, title: 'O stub empacota e manda pela rede', yk: 'NO FIO · net/rpc', rk: 'FORMATO',
        yaml: ['// o stub serializa nome e argumentos', 'ServiceMethod: "Frete.Calcular"', 'Args{Cep: "50050-000", PesoKg: 0.4}', '// codificação: gob (binário do Go)', '// porta 1234 no lab'],
        story: 'O stub transforma a chamada em bytes: o nome do método e os argumentos. No net/rpc do Go, isso é gob, um formato binário que só o Go lê. Os bytes vão pela rede até o outro lado, onde um skeleton espera.',
        look: 'O nome do método e os argumentos andam pela fita, do stub até o SKELETON do entregas.',
        key: 'O stub serializa a chamada; quem chama não vê a rede.',
        f(o, t) { const r = flow(o, t, 0.4, STUBM, 1, ['stub', 'skel']); o.on.L = 2;
          if (r.run || r.done) { o.beams.push({ pts: STUBT, on: r.run }, { pts: SKELT, on: r.run }); }
          o.cnt = C3(['O STUB MANDA', 'Frete.Calcular + Args'], ['FORMATO', 'gob (só Go)'], ['PORTA NO LAB', '1234']);
          o.res = ['gob: binário do Go'];
          if (r.run) T(o, 'tape', 'Frete.Calcular · 50050-000 · 0,4', 'acc'); if (r.done) T(o, 'skel', 'o skeleton recebeu', 'acc'); } },
      { id: 'skeleton', dur: 6, title: 'O skeleton chama a função de verdade', yk: 'NO CÓDIGO · entregas (Go)', rk: 'RESPOSTA',
        yaml: ['func (f *Frete) Calcular(', '  args Args, reply *float64) error {', '  *reply = tabela(args.Cep, args.PesoKg)', '  return nil  // 15.00 para Recife', '}'],
        story: 'O skeleton desempacota os bytes e chama Calcular de verdade, no entregas. Para o CEP 50050-000 e 0,4 kg, o frete é 15.00, o mesmo de Recife do módulo 6. A resposta volta pelo mesmo caminho: skeleton, rede, stub, e o pedidos recebe 15.00 como se tivesse chamado uma função dele. No lab, o mesmo desenho dá Proteinas.Recomendacao: peso 85, resposta 170 g.',
        look: 'O entregas acende com o cálculo; o 15.00 volta pela fita até o stub e entra no pedidos.',
        key: 'O skeleton desserializa e chama a função; a resposta faz o caminho de volta.',
        f(o, t) { if (t > 0.3) { o.on.skel = 1; } if (t > 0.8) { o.on.R = 1; o.rows.R = R_('entregas', 'Go', ['Calcular(50050-000, 0.4)'], ['= 15.00', 'acc']); }
          send(o, t, 0.3, 0.8, [[688, 314, Z], [688, YF, Z]], '', 'hi', 0.2);
          const r = flow(o, t, 1.6, STUBR, -1, ['stub', 'skel']);
          if (r.run) o.beams.push({ pts: STUBT, on: true }, { pts: SKELT, on: true });
          if (r.done) { o.on.stub = 1; send(o, t, 1.6 + fdur(5), 2.2 + fdur(5), [[127, 314, Z], [127, YF, Z]], '', 'acc', 3); }
          if (r.done && t > 2.3 + fdur(5)) { o.on.L = 1; o.rows.L = PED(['frete = 15.00', 'acc'], ['como se fosse local', 'dim']); o.res = ['frete = 15.00 · err = nil']; }
          o.cnt = C3(['FRETE', r.done ? '15.00' : '…'], ['CEP', '50050-000 (Recife)'], ['NO LAB', 'peso 85 → 170 g']);
          if (r.run) T(o, 'tape', '15.00', 'acc'); } },
      { id: 'contrato', dur: 5.5, pt: 1.6, title: 'Sem contrato: só fala Go', yk: 'NO FIO · JSON-RPC 2.0', rk: 'O MESMO PEDIDO',
        yaml: [JRPC.slice(0, 41), JRPC.slice(41)], ys: ['{"jsonrpc":"2.0",', ' "method":"Frete.Calcular",', ' "params":{"cep":"50050-000",', '           "peso_kg":0.4},', ' "id":1}', '// 93 B · qualquer linguagem lê'],
        story: 'O net/rpc não tem contrato escrito: o "contrato" é o tipo Go dos dois lados, e o gob só fala com clientes Go. A documentação do pacote diz que ele está congelado, sem novidades. Outros RPC resolvem isso de jeitos diferentes: XML-RPC, SOAP, Thrift, gRPC. No JSON-RPC 2.0, a mesma chamada vira 93 bytes de JSON que qualquer linguagem lê.',
        look: 'O bloco net/rpc ao fundo acende; pela fita passam os 93 bytes da mesma chamada em JSON-RPC.',
        key: 'net/rpc: sem contrato fora do código Go, e o pacote está congelado.',
        f(o, t) { o.on.K = 1; o.rows.K = R_('net/rpc', 'Go', ['contrato = tipo Go', 'bad'], ['gob: só fala com Go', 'bad'], ['pacote congelado', 'dim']);
          const r = flow(o, t, 0.4, JR, 1, ['stub', 'skel']); if (r.run) o.beams.push({ pts: STUBT, on: true }, { pts: SKELT, on: true });
          o.cnt = C3(['JSON-RPC 2.0', B_(r.n, 93)], ['net/rpc', 'gob · só Go'], ['O PACOTE', 'congelado']);
          o.res = ['method + params + id'];
          if (r.run) T(o, 'tape', 'JSON-RPC 2.0 · 93 B', 'acc'); } },
      { id: 'pendurado', dur: 7, title: 'E se der errado: sem deadline, espera para sempre', yk: 'NO CÓDIGO · o cliente do lab', rk: 'RESPOSTA',
        yaml: ['err := client.Call("Frete.Calcular", args, &frete)', '// nenhum prazo: se o servidor travar,', '// esta linha não volta nunca', '// conserto: deadline em toda chamada', '// (o gRPC leva o prazo no contexto)'],
        ys: ['client.Call("Frete.Calcular",', '  args, &frete)', '// sem prazo: se o servidor travar,', '//   esta linha não volta', '// conserto: deadline em', '//   toda chamada'],
        story: 'O cliente do lab chama client.Call sem prazo nenhum. Agora o entregas trava, num deadlock como os do módulo 11: recebe a chamada e não responde. O pedidos fica pendurado na linha do Call para sempre, segurando a goroutine e o pedido do Davi. O RPC faz a rede parecer uma função local, e a rede falha de jeitos que uma função local não falha (Waldo e outros, 1994).',
        look: 'O entregas fica vermelho e parado; o relógio do pedidos não para de subir e nenhuma resposta volta pela fita.',
        key: 'Toda chamada remota precisa de um deadline; sem ele, uma falha do outro lado prende quem chamou.',
        f(o, t) { const s = t < 1.4 ? 0 : Math.round((t - 1.4) * 40);
          const r = flow(o, t, 0.3, STUBM, 1, ['stub', 'skel']); if (r.run) o.beams.push({ pts: STUBT, on: true }, { pts: SKELT, on: true });
          if (r.done) { o.on.R = 'bad'; o.on.skel = 'bad'; o.rows.R = R_('entregas', 'Go', ['travado: deadlock', 'bad'], ['não responde', 'bad']); }
          o.on.L = 2; o.rows.L = PED(['client.Call(...)', 'dim'], [s ? `esperando há ${s} s` : 'esperando…', s ? 'bad' : 'dim']);
          o.cnt = C3(['ESPERANDO HÁ', s + ' s', s ? 'bad' : ''], ['PRAZO DA CHAMADA', 'nenhum', 'bad'], ['RESPOSTA', 'nunca', 'bad']);
          o.res = s ? ['… nada volta'] : [];
          if (t > 4) T(o, 'L', 'pendurado para sempre', 'bad'); if (t > 5.2) T(o, 'K', 'conserto: deadline\nem toda chamada', 'acc'); } },
    ],
    grpc: [
      { id: 'chamada', dur: 5, pt: 1.8, title: 'A mesma cobrança em gRPC: 136 B', yk: 'NO FIO · HEADERS (HPACK)', rk: 'DATA · 16 B',
        yaml: ['ctx, cancel := context.WithTimeout(ctx, time.Second)', 'res, err := client.Cobrar(ctx, &pb.CobrancaRequest{', '  PedidoId: 1050, ValorCentavos: 2890, Meio: "pix"})', '', ':method POST · :scheme http', ':path /loja.pagamentos.v1.Pagamentos/Cobrar', ':authority · content-type: application/grpc+proto', 'user-agent: grpc-go/1.62.1 · te: trailers', 'grpc-timeout: 996250u'],
        ys: [':method POST · :scheme http', ':path /loja.pagamentos.v1.Pagamentos/Cobrar', 'content-type: application/grpc+proto', 'user-agent: grpc-go/1.62.1', 'te: trailers', 'grpc-timeout: 996250u'],
        story: 'Agora a mesma cobrança vai em gRPC, sobre HTTP/2. O pedidos chama Pagamentos.Cobrar com um prazo de 1 s, que viaja junto (grpc-timeout, em microssegundos). No fio vão dois quadros: um HEADERS de 102 bytes, com os cabeçalhos comprimidos pelo HPACK, e um DATA de 16: 5 de prefixo do gRPC mais os 11 do Protobuf. Cada quadro tem mais 9 de cabeçalho próprio.',
        look: 'Na fita passam o cabeçalho do quadro (9 casas), os 102 do HPACK, outro cabeçalho de quadro, o prefixo de 5 e, acesos, os 11 bytes do pedido.',
        key: 'gRPC: o pedido vira quadros HTTP/2; cabeçalhos comprimidos e corpo em Protobuf.',
        f(o, t) { const r = flow(o, t, 0.4, G1C);
          o.cnt = C3(['BYTES QUE CHEGARAM', B_(r.n, 136)], ['HEADERS', '9 + 102 B'], ['DATA', '9 + 16 B']);
          o.res = ['00 00 00 00 0b · 08 9a 08 10 ca 16 1a 03 70 69 78'];
          if (r.done) o.rows.K = HPK(['guardou os cabeçalhos'], ['para a próxima', 'dim']);
          if (r.run) T(o, 'tape', 'Pagamentos/Cobrar · 136 B', 'acc'); } },
      { id: 'trailers', dur: 5, pt: 1.4, title: 'A resposta fecha com trailers: grpc-status 0', yk: 'NO FIO · resposta (93 B)', rk: 'CORPO · 18 B',
        yaml: ['HEADERS (19 B): :status 200', '  content-type: application/grpc+proto', 'DATA (23 B): 00 00 00 00 12 + 18 B', 'HEADERS, fim (24 B) = trailers:', '  grpc-status: 0', '  grpc-message: (vazio)'],
        story: 'O pagamentos responde com três quadros: HEADERS (:status 200), DATA com os 18 bytes da resposta em Protobuf e, por último, os trailers, cabeçalhos que vêm depois do corpo. É neles que vai o resultado do gRPC: grpc-status 0, que quer dizer OK. Os códigos do gRPC não são os do HTTP: o 200 só diz que o HTTP/2 funcionou. A primeira chamada da conexão custou 136 + 93 = 229 bytes.',
        look: 'A fita volta do pagamentos: três quadros, com os 18 bytes da resposta acesos no meio.',
        key: 'No gRPC o resultado vem nos trailers (grpc-status), depois do corpo.',
        f(o, t) { const r = flow(o, t, 0.4, G1S, -1);
          o.cnt = C3(['BYTES DE VOLTA', B_(r.n, 93)], ['1ª CHAMADA', '136 + 93 = 229 B'], ['GRPC-STATUS', r.done ? '0 (OK)' : '…']);
          o.res = ['cobranca_id: "c-7731" · status: "pendente"'];
          if (r.done) o.rows.L = PED(['c-7731 · pendente', 'acc'], ['grpc-status: 0', 'dim']);
          if (r.run) T(o, 'tape', 'HEADERS · DATA · trailers', 'acc'); } },
      { id: 'hpack', dur: 5.5, pt: 1.1, title: 'Da 2ª chamada em diante: 103 B', yk: 'NO FIO · a próxima chamada', rk: 'POR CHAMADA',
        yaml: ['cliente: HEADERS 9 + 15 · DATA 9 + 16 = 49 B', 'servidor: HEADERS 9 + 2 · DATA 9 + 23', '          trailers 9 + 2 = 54 B', '# a tabela do HPACK já guarda os cabeçalhos:', '# cada um vira 1 byte de índice', '# o grpc-timeout muda: vai por extenso'],
        ys: ['cliente: HEADERS 9 + 15', '         DATA 9 + 16 = 49 B', 'servidor: 9 + 2 · 9 + 23 · 9 + 2', '          = 54 B', '# HPACK: cabeçalho repetido', '#   vira 1 byte de índice'],
        story: 'Na próxima chamada pela mesma conexão, os cabeçalhos quase somem. O HPACK guarda numa tabela, dos dois lados, o que já passou: :path, content-type, user-agent viram 1 byte de índice cada. O HEADERS do cliente cai de 102 para 15 bytes; só o grpc-timeout vai por extenso, porque o prazo restante muda a cada chamada. O do servidor cai para 2.',
        look: 'O bloco HPACK acende; a fita passa bem mais curta nos dois sentidos: 49 casas de ida e 54 de volta.',
        key: 'HPACK: cabeçalho que se repete vira um índice; a partir da 2ª chamada, 103 B.',
        f(o, t) { const a = flow(o, t, 0.4, G2C), b = flow(o, t, 0.6 + fdur(49), G2S, -1);
          o.on.K = 1; o.rows.K = HPK(['cabeçalhos já guardados', 'acc'], ['índice: 1 byte cada', 'dim']);
          o.cnt = C3(['BYTES NO FIO', B_(a.n + b.n, 103)], ['CLIENTE', '49 B (HEADERS: 15)'], ['SERVIDOR', '54 B (HEADERS: 2)']);
          o.res = ['49 + 54 = 103 B (na 1ª: 229 B)'];
          if (a.run) T(o, 'tape', 'ida: 49 B', 'acc'); if (b.run) T(o, 'tape', 'volta: 54 B', 'acc'); } },
      { id: 'conta', dur: 8, pt: 2.2, title: 'REST 360 B, gRPC 103 B', yk: 'A CONTA', rk: 'O GANHO DE VERDADE',
        yaml: ['REST/HTTP/1.1:  210 + 150 = 360 B, toda chamada', 'gRPC/HTTP/2:    229 B na 1ª, 103 B depois', '360 ÷ 103 = 3,5× menos bytes', '100 cobranças/s: 36 KB/s × 10,3 KB/s', '# o ganho maior: contrato tipado,', '# chamadas multiplexadas e streaming'],
        ys: ['REST:  210 + 150 = 360 B', '       em toda chamada', 'gRPC:  229 B na 1ª, 103 depois', '360 ÷ 103 = 3,5×', '100 cobranças/s:', '  36 KB/s × 10,3 KB/s'],
        story: 'Lado a lado: a ida do REST passa com 210 bytes, a do gRPC com 49. Contando ida e volta, são 360 bytes contra 103, 3,5 vezes menos. A 100 cobranças por segundo, 36 KB/s contra 10,3 KB/s. Para uma chamada interna, isso é pouco. O que mais pesa a favor do gRPC é o contrato tipado, as chamadas multiplexadas numa conexão só e o streaming.',
        look: 'Primeiro passa a ida do REST, comprida; depois a do gRPC, curta. O mostrador mostra as duas contas.',
        key: 'Em bytes o gRPC ganha 3,5×; o ganho maior é o contrato e a conexão compartilhada.',
        f(o, t) { const a = flow(o, t, 0.4, REQ), b = flow(o, t, 1 + fdur(210), G2C);
          o.cnt = C3([a.run || !b.n ? 'REST · IDA' : 'gRPC · IDA', a.run || !b.n ? B_(a.n, 210) : B_(b.n, 49)], ['REST, IDA E VOLTA', '360 B sempre'], ['gRPC, IDA E VOLTA', '229 B · depois 103 B']);
          o.res = ['contrato tipado · multiplexação · streaming'];
          if (a.run) T(o, 'tape', 'REST: 210 B de ida', 'hi'); if (b.run) T(o, 'tape', 'gRPC: 49 B de ida', 'acc'); } },
      { id: 'l4', dur: 7, title: 'E se der errado: o LB de camada 4 prende as conexões', yk: 'BALANCEAMENTO', rk: 'CONSERTO',
        yaml: ['# pedidos: 3 réplicas, 1 conexão HTTP/2 cada', '# o LB de camada 4 (módulo 7) escolhe', '#   o destino ao abrir a conexão', '# depois, todas as chamadas vão por ela', 'pagamentos-1: 100% · pagamentos-2: 0%', '# conserto: balancear por chamada (L7)'],
        ys: ['# 3 réplicas do pedidos,', '#   1 conexão HTTP/2 cada', '# o LB L4 escolhe ao conectar', '# e as chamadas seguem nela', 'pagamentos-1: 100%', 'pagamentos-2: 0%'],
        story: 'O pedidos tem 3 réplicas, e cada uma abre uma conexão HTTP/2 com o pagamentos e a mantém aberta. Um balanceador de camada 4, como o do módulo 7, escolhe o destino quando a conexão abre, e depois não vê mais as chamadas que passam dentro dela. As 3 conexões caíram no pagamentos-1: ele recebe tudo, e o pagamentos-2 fica a 0%.',
        look: 'Três linhas saem do pedidos, passam pelo LB e vão todas ao pagamentos-1; o pagamentos-2, na frente, fica vermelho e parado.',
        key: 'HTTP/2 mantém a conexão; balanceamento de camada 4 não reparte as chamadas.',
        f(o, t) { o.show.M = 1; o.show.F4 = 1; o.show.tape = 0;
          o.rows.L = R_('pedidos', '3 réplicas', ['3 conexões HTTP/2', ''], ['abertas e mantidas', 'dim']); o.rows.R = R_('pagamentos-1', 'réplica', [t > 1 ? 'recebe 100%' : '…', t > 1 ? 'acc' : 'dim']);
          o.rows.F4 = R_('pagamentos-2', 'réplica', [t > 1.5 ? '0% · parado' : '…', 'bad']); if (t > 1.5) o.on.F4 = 'bad';
          [226, 246, 266].forEach((y, i) => {
            const ph = t > 2 ? ((t - 2 + i * 0.4) % 1.2) / 1.2 : clamp((t - 0.3 - i * 0.3) / 1.2);
            o.beams.push({ pts: [...LM(y), ...MR(y)], on: t > 0.3 + i * 0.3, dot: t > 0.3 + i * 0.3 ? ph : null }); });
          o.beams.push({ pts: M_F4 });
          o.cnt = C3(['pagamentos-1', t > 1 ? '100% das chamadas' : '…'], ['pagamentos-2', t > 1.5 ? '0%' : '…', 'bad'], ['CONEXÕES', '3, abertas e mantidas']);
          o.res = t > 4 ? ['balancear por chamada: L7,', 'sidecar da malha ou no cliente'] : [];
          if (t > 2.2) T(o, 'M', 'L4 vê conexões, não chamadas', 'bad'); if (t > 4.2) T(o, 'F4', 'conserto: balancear por chamada\n(L7, sidecar ou cliente)', 'acc'); } },
    ],
    proto: [
      { id: 'campos', dur: 5, title: 'Os nomes não viajam: só os números', yk: 'NO FIO · CobrancaRequest', rk: 'O MESMO EM JSON',
        yaml: ['message CobrancaRequest {', '  int64  pedido_id      = 1;', '  int64  valor_centavos = 2;', '  string meio           = 3;', '}', '08 9a 08 10 ca 16 1a 03 70 69 78  (11 B)'],
        story: 'Estes são os 11 bytes do pedido 1050 em Protobuf: 08 9a 08 10 ca 16 1a 03 70 69 78. Os nomes pedido_id, valor_centavos e meio não estão em lugar nenhum. O que viaja é o número de cada campo, combinado no .proto. Os dois lados leem o mesmo contrato e sabem que o campo 1 é o pedido, o 2 é o valor em centavos e o 3 é o meio de pagamento.',
        look: 'A fita para e mostra os 11 bytes grandes; embaixo de cada um, o papel dele. O .proto acende ao fundo.',
        key: 'Protobuf manda número de campo e valor; os nomes ficam no contrato.',
        f(o, t) { o.on.K = t > 0.4 ? 1 : 0; o.tape = { big: PB.map((h, i) => ({ ch: h, sub: ['tag 1', '1050', '', 'tag 2', '2890', '', 'tag 3', '3 B', 'p', 'i', 'x'][i], role: [0, 3, 6].includes(i) ? 'f' : 'b', on: t > 0.6 })) };
          o.cnt = C3(['O PEDIDO 1050', '11 B'], ['NOMES DE CAMPO NO FIO', '0'], ['NÚMEROS DE CAMPO', '1 · 2 · 3']);
          o.res = [BODY];
          if (t > 1.2) T(o, 'K', 'o contrato diz o que é\ncada número', 'acc'); } },
      { id: 'tag', dur: 5, title: '08: campo 1, tipo varint', yk: 'A TAG', rk: 'AS OUTRAS TAGS',
        yaml: ['tag = (número do campo << 3) | tipo', 'campo 1, tipo 0 (varint):', '  1 << 3 | 0 = 8 = 0x08', 'campo 2, varint:  2 << 3 | 0 = 0x10', 'campo 3, tamanho + bytes:', '  3 << 3 | 2 = 26 = 0x1a'],
        story: 'O primeiro byte, 08, é uma tag. Ela junta duas coisas: o número do campo, deslocado 3 bits para a esquerda, e o tipo do valor nos 3 bits de baixo. Campo 1, tipo 0 (varint, um número inteiro): 1 << 3 | 0 = 8. Do mesmo jeito, 10 é o campo 2 e 1a é o campo 3 com tipo 2, "tamanho e depois os bytes".',
        look: 'O 08 acende; depois o 10 e o 1a, as outras duas tags.',
        key: 'Tag = número do campo << 3 | tipo; 08 é "campo 1, varint".',
        f(o, t) { const on = t < 2.2 ? [0] : [0, 3, 6]; o.tape = { big: bigCells(on) };
          o.cnt = C3(['TAG', t < 2.2 ? '0x08' : '0x08 · 0x10 · 0x1a'], ['CAMPO', t < 2.2 ? '1 (pedido_id)' : '1 · 2 · 3'], ['TIPO', t < 2.2 ? '0 = varint' : '0 · 0 · 2']);
          o.res = ['0x10 = campo 2 · 0x1a = campo 3']; } },
      { id: 'varint', dur: 6.5, title: '9a 08 = 1050 e ca 16 = 2890', yk: 'O VARINT', rk: 'CONFERE',
        yaml: ['1050 = 8 × 128 + 26', '  26 = 0x1a → com o bit "continua":', '  0x1a | 0x80 = 0x9a, depois 0x08', '2890 = 22 × 128 + 74', '  74 = 0x4a → 0x4a | 0x80 = 0xca', '  depois 22 = 0x16'],
        story: 'Varint guarda um inteiro em pedaços de 7 bits, o menor primeiro. 1050 é 8 × 128 + 26. O 26 vai primeiro, 0x1a, com o bit de cima ligado para dizer "tem mais": 0x9a. Depois vem o 8: 0x08. O valor 2890 é 22 × 128 + 74: 0xca e 0x16. Número pequeno ocupa poucos bytes: 1050 e 2890 cabem em 2 cada.',
        look: 'Acendem o 9a 08 (1050) e, depois, o ca 16 (2890).',
        key: 'Varint: 7 bits por byte, o bit de cima avisa que vem mais.',
        f(o, t) { const two = t > 3.2; o.tape = { big: bigCells(two ? [4, 5] : [1, 2]) };
          o.cnt = C3([two ? 'ca 16' : '9a 08', two ? '2890' : '1050'], ['CONTA', two ? '22 × 128 + 74' : '8 × 128 + 26'], ['BYTES', '2']);
          o.res = [two ? '0x4a + 0x16 × 128 = 74 + 2816 = 2890' : '0x1a + 0x08 × 128 = 26 + 1024 = 1050']; } },
      { id: 'texto', dur: 5, title: '1a 03 70 69 78 = "pix"', yk: 'TAMANHO + BYTES', rk: 'O TEXTO',
        yaml: ['1a  campo 3, tipo 2 (tamanho + bytes)', '03  tamanho: 3 bytes', '70  p', '69  i', '78  x', '# texto vai como UTF-8, sem aspas'],
        story: 'O campo 3 é texto, então vem com o tamanho na frente: 1a (campo 3, tipo 2), 03 (são 3 bytes) e as letras em UTF-8, 70 69 78, que são p, i, x. Sem aspas, sem nome do campo. Somando as três partes, o pedido inteiro tem 3 + 3 + 5 = 11 bytes.',
        look: 'Acendem os 5 últimos: a tag, o tamanho e as três letras.',
        key: 'Texto em Protobuf: tag, tamanho e os bytes, sem aspas nem nome.',
        f(o, t) { o.tape = { big: bigCells([6, 7, 8, 9, 10]) };
          o.cnt = C3(['CAMPO 3', '"pix"'], ['TAMANHO', '3 B'], ['O PEDIDO INTEIRO', '3 + 3 + 5 = 11 B']);
          o.res = ['70 69 78 = "pix" em UTF-8']; } },
      { id: 'tamanho', dur: 5, title: '11 bytes contra 53', yk: 'LADO A LADO', rk: 'A RESPOSTA',
        yaml: ['JSON:     53 B   {"pedido_id":1050,...}', 'Protobuf: 11 B   08 9a 08 10 ca 16 ...', '4,8× menor', 'resposta: 44 B de JSON', '          18 B de Protobuf', '0a 06 "c-7731" 12 08 "pendente"'],
        story: 'Lado a lado, o mesmo pedido: 53 bytes em JSON, 11 em Protobuf, 4,8 vezes menor. A resposta também encolhe: 44 bytes de JSON, 18 de Protobuf. A diferença vem dos nomes e das aspas que não viajam, e dos números guardados em binário em vez de texto.',
        look: 'Duas linhas na fita: em cima, as 53 casas do JSON; embaixo, as 11 do Protobuf.',
        key: 'Mesmo dado, 53 B em JSON e 11 B em Protobuf.',
        f(o, t) { o.tape = { rows: [text(BODY, 'b'), PB.map((h, i) => ({ ch: '', role: [0, 3, 6].includes(i) ? 'f' : 'b' }))] };
          o.cnt = C3(['JSON', '53 B'], ['PROTOBUF', '11 B'], ['MENOR', '4,8×']);
          o.res = ['44 B de JSON · 18 B de Protobuf'];
          if (t > 0.5) { T(o, [407, 200, 30], 'JSON · 53 B', 'hi'); T(o, [300, 290, 12], 'Protobuf · 11 B', 'acc'); } } },
      { id: 'numero', dur: 7, title: 'E se der errado: o número do campo reusado', yk: 'O CONTRATO MUDOU', rk: 'CONSERTO',
        yaml: ['// v2 do pagamentos:', 'message CobrancaRequest {', '  int64  pedido_id = 1;', '  double valor     = 2;  // reusou o 2!', '  string meio      = 3;', '}'],
        ys: ['// pagamentos v2:', '  double valor = 2;  // reusou o 2', '// o pedidos antigo manda:', '//   10 ca 16 (campo 2, varint)', '// o v2 espera 64 bits no campo 2:', '//   vira campo desconhecido'],
        story: 'O time do pagamentos troca valor_centavos por double valor e reaproveita o número 2. O pedidos, ainda na versão antiga, manda 10 ca 16: campo 2, tipo varint. O pagamentos novo espera um double de 64 bits no campo 2, não reconhece o tipo e guarda os bytes como campo desconhecido. O valor fica 0, e a cobrança sai de 0,00 sem erro nenhum.',
        look: 'O 10 ca 16 fica vermelho na fita, o .proto v2 acende vermelho ao fundo e o pagamentos mostra valor 0.',
        key: 'Nunca reuse número de campo; o antigo vira reserved.',
        f(o, t) { o.tape = { big: bigCells(t > 0.8 ? [3, 4, 5] : [], t > 0.8 ? 'bad' : '') };
          o.on.K = 'bad'; o.rows.K = R_('pagamentos.proto', 'v2', ['  int64  pedido_id = 1;', 'dim'], ['  double valor = 2;  // reusou', 'bad'], ['  string meio = 3;', 'dim']);
          if (t > 2) { o.on.R = 'bad'; o.rows.R = PAG(['valor = 0', 'bad'], ['campo 2: desconhecido', 'bad']); }
          o.cnt = C3(['O PAGAMENTOS LÊ', t > 2 ? 'valor = 0' : '…', 'bad'], ['CAMPO 2 CHEGA COMO', t > 2 ? 'desconhecido' : '…', 'bad'], ['ERRO VISÍVEL', 'nenhum', 'bad']);
          o.res = t > 3.5 ? ['reserved 2; e um número novo', 'para o campo novo'] : [];
          if (t > 3.5) T(o, 'K', 'conserto: reserved 2;\nnúmero novo para o campo novo', 'acc'); } },
    ],
    graphql: [
      { id: 'consulta', dur: 5, pt: 1.5, title: 'Uma consulta de 131 bytes', yk: 'NO FIO · POST /graphql', rk: 'A CONSULTA',
        yaml: ['{', '  destaque: produto(id: 42) { nome preco foto }', '  carrinho { itens }', '  recomendado: recomendados(produto: 42) { id nome preco }', '  pedido(id: 1048) { status }', '}'],
        ys: ['{ destaque: produto(id: 42)', '    { nome preco foto }', '  carrinho { itens }', '  recomendado: recomendados(produto: 42)', '    { id nome preco }', '  pedido(id: 1048) { status } }'],
        story: 'A tela inicial do app da Lena, a mesma do módulo 9, agora como uma consulta só: POST /graphql com 131 bytes. O app escreve exatamente os campos que quer: nome, preço e foto do gato, o número de itens do carrinho, as recomendações e o status do pedido 1048. No módulo 9, quem decidia a forma era o código do bff-app; aqui, quem decide é o cliente.',
        look: 'A consulta anda pela fita, do app até o servidor graphql.',
        key: 'GraphQL: o cliente escreve os campos que quer, numa chamada só.',
        f(o, t) { const r = flow(o, t, 0.4, GQ);
          o.cnt = C3(['BYTES QUE CHEGARAM', B_(r.n, 131)], ['CHAMADAS DO APP', '1'], ['ROTA', 'POST /graphql']);
          o.res = ['4 campos de 4 serviços'];
          if (r.run) T(o, 'tape', 'consulta · 131 B', 'acc'); } },
      { id: 'resolvers', dur: 6, title: '4 resolvers buscam em 4 serviços', yk: 'RESOLVERS', rk: 'O MESMO SCHEMA SERVE',
        yaml: ['Query.produto      → catalogo', 'Query.carrinho     → carrinho', 'Query.recomendados → recomendacoes', 'Query.pedido       → pedidos', '# uma função por campo;', '# cada uma busca o seu pedaço'],
        story: 'O servidor lê a consulta contra o schema e chama um resolver por campo: produto vai ao catalogo, carrinho ao carrinho, recomendados ao recomendacoes, pedido ao pedidos. São as 4 chamadas que, sem BFF, o app fazia sozinho: 4 de 120 ms, 480 ms e 180 KB. Agora o app faz 1, e o mesmo schema serve app, site e voz.',
        look: 'O graphql acende e quatro luzes descem até os quatro serviços da frente, uma por resolver.',
        key: 'Resolver: uma função por campo, que busca o dado onde ele mora.',
        f(o, t) { o.on.R = t > 0.3 ? 1 : 0; o.rows.R = R_('graphql', 'resolvers', ['produto · carrinho', 'acc'], ['recomendados · pedido', 'acc']);
          const lab = ['produto(42)', 'carrinho', 'recomendados(42)', 'pedido(1048)'], back = ['gato · 79.90', 'itens: 1', 'caneca azul', 'a caminho'];
          let n = 0; [1, 2, 3, 4].forEach((f, i) => { const a = 0.4 + i * 0.35; send(o, t, a, a + 0.9, RF(f), lab[i], 'hi', 0.1);
            if (send(o, t, a + 1.6, a + 2.4, rev(RF(f)), back[i], 'acc', 0.6)) n++; });
          o.cnt = C3(['RESOLVERS', '4'], ['RESPOSTAS', `${n} de 4`], ['CHAMADAS DO APP', '1 (eram 4 · 480 ms)']);
          o.res = ['app, site e voz'];
          if (t > 4.6) T(o, 'R', '4 resolvers, 1 consulta', 'acc'); } },
      { id: 'resposta', dur: 5.5, pt: 2, title: 'Só os campos pedidos voltam', yk: 'NO FIO · a resposta', rk: 'O FORMATO',
        yaml: ['{"data": {', '  "destaque": {"nome":"gato de pelúcia","preco":79.90,"foto":"gato-320.webp"},', '  "carrinho": {"itens":1},', '  "recomendado": [{"id":7,"nome":"caneca azul","preco":19.90}],', '  "pedido": {"status":"a caminho"}', '}}'],
        ys: ['{"data": {', '  "destaque": {"nome":"gato de pelúcia",', '    "preco":79.90,"foto":"gato-320.webp"},', '  "carrinho": {"itens":1},', '  "recomendado": [{"id":7,...}],', '  "pedido": {"status":"a caminho"} }}'],
        story: 'A resposta tem a forma exata da consulta, dentro de "data": destaque, carrinho, recomendado e pedido, os mesmos nomes da resposta do bff-app no módulo 9, e nenhum campo a mais. São 201 bytes; o "ú" de pelúcia ocupa 2 deles em UTF-8.',
        look: 'A resposta volta pela fita, do graphql para o app.',
        key: 'A resposta tem a forma da consulta: nada a mais, nada a menos.',
        f(o, t) { const r = flow(o, t, 0.4, GR, -1);
          o.cnt = C3(['BYTES DE VOLTA', B_(r.n, 201)], ['CAMPOS', 'só os pedidos'], ['QUEM ESCOLHE A FORMA', 'o cliente']);
          o.res = ['a forma do bff-app (módulo 9)'];
          if (r.done) o.rows.L = R_('app da Lena', 'tela inicial', ['tela pronta', 'acc'], ['1 chamada', 'dim']);
          if (r.run) T(o, 'tape', 'resposta · 201 B', 'acc'); } },
      { id: 'n1', dur: 10, title: 'E se der errado: N+1, 21 chamadas', yk: 'A CONSULTA', rk: 'COM DATALOADER',
        yaml: ['{ produtos(first: 20) {', '    nome', '    estoque { quantidade }', '} }', '# resolver ingênuo: 1 + 20 = 21 chamadas', '# DataLoader: agrupa → 1 + 1 = 2'],
        story: 'Uma consulta pede 20 produtos e o estoque de cada um. O resolver de estoque, escrito do jeito ingênuo, roda uma vez por produto: 1 chamada ao catalogo e 20 ao estoque, 21 ao todo. É o problema N+1. Com DataLoader, as 20 perguntas do mesmo instante viram uma só, em lote: 1 + 1 = 2. Outros riscos: consulta cara demais, nenhum cache HTTP numa rota só e erros que voltam com status 200.',
        look: 'A luz vai ao catalogo uma vez e ao estoque 20 vezes, e o contador chega a 21 em vermelho. Depois o DataLoader liga e são só 2.',
        key: 'N+1: um resolver por item multiplica as chamadas; o DataLoader junta em lote.',
        f(o, t) { o.rows.F1 = R_('catalogo', '', ['produtos(first: 20)', 'dim']); o.rows.F2 = R_('estoque', '', ['quantidade', 'dim']);
          o.show.F3 = o.show.F4 = 0; o.tape = null;
          const dl = t > 6.2; let n = 0;
          if (!dl) { send(o, t, 0.3, 0.9, RF(1), 'produtos(20)', 'hi', 0.2); if (t > 0.9) n = 1;
            for (let i = 0; i < 20; i++) { const a = 1.2 + i * 0.22; if (t > a + 0.2) n = 2 + i; if (t > a && t < a + 0.3) send(o, t, a, a + 0.2, RF(2), '', 'bad', 0.05); }
            if (t > 5.6) quiet(o, RF(1), RF(2)); if (n > 1) { o.on.F2 = 'bad'; o.rows.F2 = R_('estoque', '', [`${n - 1} chamadas`, 'bad']); } }
          else { send(o, t, 6.4, 7.0, RF(1), 'produtos(20)', 'hi', 0.2); if (send(o, t, 7.2, 7.9, RF(2), 'lote: 20 ids', 'acc', 1)) { o.rows.F2 = R_('estoque', '', ['1 chamada em lote', 'acc']); }
            n = t > 7.9 ? 2 : t > 7.0 ? 1 : 0; }
          o.rows.R = R_('graphql', dl ? 'com DataLoader' : 'resolver ingênuo', [dl ? 'agrupa por tick' : 'estoque: 1 por produto', dl ? 'acc' : 'bad']);
          o.cnt = C3(['CHAMADAS', String(n), !dl && n > 2 ? 'bad' : ''], ['AO ESTOQUE', dl ? (n > 1 ? '1 (em lote)' : '0') : String(Math.max(0, n - 1)), dl ? 'acc' : 'bad'], ['DATALOADER', dl ? 'ligado' : 'desligado', dl ? 'acc' : 'bad']);
          o.res = dl && n === 2 ? ['1 + 1 = 2 chamadas (eram 21)'] : !dl && n === 21 ? ['1 + 20 = 21 chamadas'] : [];
          if (!dl && t > 5.6) T(o, 'F2', '1 + 20 = 21', 'bad'); if (dl && t > 8) T(o, 'F2', 'DataLoader: 1 + 1 = 2', 'acc'); } },
    ],
    converge: [
      { id: 'fora', dur: 5, title: 'Na porta de fora: REST no gw-loja', yk: 'NO FIO · app → gw-loja', rk: 'POR QUÊ',
        yaml: ['POST /api/v1/pedidos HTTP/1.1', 'Host: api.loja.com.br', 'Authorization: Bearer eyJ…  (módulo 8)', 'Content-Type: application/json', '# corpo: a caneca azul (produto 7), Pix'],
        story: 'O desenho final da loja põe cada protocolo onde ele rende. Na porta de fora, para o app, o site e os parceiros, fica REST com JSON no gw-loja do módulo 8: qualquer linguagem fala, o navegador fala, e o contrato é fácil de entender. Se a empresa quiser, GraphQL entra no lugar do bff-app.',
        look: 'A luz sai do app do Davi e entra no gw-loja: a primeira seta, REST/JSON.',
        key: 'De fora para dentro: REST/JSON, que todo cliente entende.',
        f(o, t) { send(o, t, 0.3, 1.3, LM(), 'POST /api/v1/pedidos', 'hi'); if (t > 1.3) o.on.M = 1;
          quiet(o, MR(), R_F4, F4F2);
          o.cnt = C3(['PROTOCOLO', 'REST · JSON'], ['QUEM USA', 'app · site · parceiro'], ['ONDE', 'gw-loja (módulo 8)']);
          o.res = ['simples de entender, todo cliente fala'];
          if (t > 1.6) T(o, [271, 176, 26], 'REST/JSON', 'acc'); } },
      { id: 'traduz', dur: 5, title: 'O gateway traduz para gRPC', yk: 'TRANSCODIFICAÇÃO', rk: 'NAVEGADOR',
        yaml: ['# no gw-loja (ex.: Envoy gRPC-JSON transcoder)', 'POST /api/v1/pedidos  →  Pedidos.Criar', 'JSON                  →  Protobuf', '# o app nem sabe que lá dentro é gRPC', '# navegador não fala gRPC puro:', '#   precisaria de gRPC-Web'],
        ys: ['POST /api/v1/pedidos', '  → Pedidos.Criar', 'JSON → Protobuf', '# ex.: Envoy gRPC-JSON', '#   transcoder', '# navegador: só gRPC-Web'],
        story: 'O gw-loja recebe o JSON e passa adiante em gRPC: o POST /api/v1/pedidos vira Pedidos.Criar, e o JSON vira Protobuf. Isso se chama transcodificação, e o Envoy faz com o filtro gRPC-JSON transcoder. O app nem fica sabendo. É também por isso que o gRPC fica por dentro: o navegador não fala gRPC puro, só gRPC-Web.',
        look: 'O gw-loja acende e a luz segue para o pedidos já em gRPC: a segunda seta muda de nome.',
        key: 'O gateway traduz REST de fora em gRPC de dentro.',
        f(o, t) { o.beams.push({ pts: LM(), on: false }); o.on.M = 1; send(o, t, 0.6, 1.6, MR(), 'Pedidos.Criar · Protobuf', 'acc');
          quiet(o, R_F4, F4F2);
          o.cnt = C3(['ENTRA', 'REST · JSON'], ['SAI', 'gRPC · Protobuf'], ['QUEM TRADUZ', 'o gw-loja']);
          o.res = ['navegador: só gRPC-Web'];
          if (t > 1.8) { T(o, [271, 176, 26], 'REST/JSON', 'hi'); T(o, [544, 176, 26], 'gRPC', 'acc'); } } },
      { id: 'dentro', dur: 5, title: 'Por dentro: gRPC, com mTLS e por chamada', yk: 'SERVIÇO A SERVIÇO', rk: 'POR QUÊ',
        yaml: ['Pagamentos.Cobrar(ctx, &CobrancaRequest{', '  PedidoId: 1050, ValorCentavos: 2890, Meio: "pix"})', '# 103 B por chamada numa conexão aberta', '# balanceado por chamada (módulo 10)', '# mTLS pela malha (módulo 10)'],
        ys: ['Pagamentos.Cobrar', '  1050 · 2890 · "pix"', '# 103 B por chamada', '# balanceado por chamada', '# mTLS pela malha', '#   (módulo 10)'],
        story: 'Entre serviços, gRPC: contrato tipado no .proto, 103 bytes por chamada numa conexão que fica aberta, balanceado por chamada e cifrado com o mTLS da malha do módulo 10. Onde o time não quer distribuir arquivos .proto, REST também serve aqui dentro.',
        look: 'A luz desce do pedidos para o pagamentos, na frente: Pagamentos.Cobrar.',
        key: 'Serviço a serviço: gRPC, com contrato forte e chamadas leves.',
        f(o, t) { o.beams.push({ pts: LM(), on: false }, { pts: MR(), on: false }); send(o, t, 0.4, 1.3, R_F4, 'Pagamentos.Cobrar · 103 B', 'acc'); quiet(o, F4F2);
          if (t > 1.3) o.on.F4 = 1;
          o.cnt = C3(['PROTOCOLO', 'gRPC · Protobuf'], ['POR CHAMADA', '103 B'], ['SEGURANÇA', 'mTLS (módulo 10)']);
          o.res = ['contrato forte, leve'];
          if (t > 1.6) T(o, [760, 330, 12], 'gRPC · mTLS', 'acc'); } },
      { id: 'terceiro', dur: 7, title: 'Para o PSP: REST de saída e webhook de volta', yk: 'COM TERCEIROS', rk: 'O AVISO',
        yaml: ['# saída: a API REST do PSP', 'POST /cobrancas  → 201 · c-7731 · 180 ms', '# volta, às 14:05:23.43:', 'POST https://api.loja.com.br/webhooks/psp', 'X-PSP-Signature: t=1792000000,v1=068149…e13a', '{"evento_id":"ev-8812","tipo":"cobranca.paga",…}'],
        ys: ['saída: POST /cobrancas', '  → c-7731 · 180 ms', 'volta, 14:05:23.43:', '  POST /webhooks/psp', '  X-PSP-Signature: …e13a', '  evento ev-8812 · 112 B'],
        story: 'Para fora, com o PSP, a loja fala a língua dele: REST de saída para criar a cobrança, 180 ms pela internet. E quando o Davi paga o Pix, às 14:05:23.4, quem avisa é o PSP: às 14:05:23.43 ele chama o webhook da loja com o evento ev-8812, assinado com HMAC. O pagamentos confere a assinatura e responde 200 em ~30 ms.',
        look: 'A luz vai do pagamentos ao PSP e volta; depois o PSP acende e chama a loja pelo caminho de baixo: o webhook.',
        key: 'Com terceiros: REST para chamar, webhook para ser avisado.',
        f(o, t) { o.beams.push({ pts: LM(), on: false }, { pts: MR(), on: false }, { pts: R_F4, on: false });
          send(o, t, 0.3, 1.2, F4F2, 'POST /cobrancas · REST', 'hi', 0.2); send(o, t, 1.6, 2.4, rev(F4F2), '201 · c-7731 · 180 ms', 'acc', 0.3);
          if (t > 3.3) o.on.F2 = 1; if (send(o, t, 3.5, 4.6, HOOK, 'webhook · ev-8812 · 14:05:23.43', 'acc', 0.3)) { o.on.F4 = 1; o.rows.F4 = R_('pagamentos', '', ['HMAC ok · 200 em 30 ms', 'acc']); }
          o.cnt = C3(['SAÍDA', 'REST · 180 ms'], ['ENTRADA', t > 4.6 ? 'webhook · ev-8812' : '…'], ['RESPOSTA AO PSP', t > 4.8 ? '200 em ~30 ms' : '…']);
          o.res = t > 4.6 ? ['cobranca.paga · c-7731 · 2890'] : [];
          if (t > 4.8) T(o, 'F2', 'webhook: o PSP avisa', 'acc'); } },
      { id: 'contrato', dur: 8, title: 'E se der errado: o .proto por e-mail', yk: 'O CONTRATO', rk: 'CONSERTO',
        yaml: ['# pagamentos v2, mandado por e-mail:', '  double valor = 2;   // era int64 valor_centavos', '# pedidos, relatorios e bff-app', '#   atualizam em dias diferentes', '# conserto: 1 repositório de contratos,', '#   pacote com versão (v1, v2), checagem no CI'],
        ys: ['# pagamentos v2 por e-mail:', '  double valor = 2;', '# 3 clientes atualizam', '#   em dias diferentes', '# conserto: repo único,', '#   v1/v2, checagem no CI'],
        story: 'O contrato do pagamentos circula por e-mail. Sai a v2, que muda o campo 2, e cada cliente atualiza quando pode: o pedidos, o relatorios e o bff-app quebram em dias diferentes, e cada quebra vira um incidente separado. O conserto: um repositório único de contratos, a versão no nome do pacote (loja.pagamentos.v1, v2) e uma checagem de compatibilidade no CI que barra a mudança.',
        look: 'O .proto v2 acende vermelho ao fundo; os três clientes do pagamentos ficam vermelhos, um de cada vez.',
        key: 'Contrato espalhado quebra devagar; repositório único, versão e CI seguram a mudança.',
        f(o, t) { o.show.L = o.show.M = o.show.F2 = 0; o.show.K = o.show.F0 = o.show.F1 = 1; o.on.K = 'bad';
          o.rows.K = R_('pagamentos.proto', 'v2', ['por e-mail, sem versão', 'bad'], ['  double valor = 2;', 'bad'], ['  // era valor_centavos', 'dim']);
          const br = [t > 1.4, t > 3.2, t > 5]; let n = br.filter(Boolean).length;
          [['R', R_F4], ['F0', F0F4], ['F1', F1F4]].forEach(([k, pts], i) => { o.beams.push({ pts, on: br[i], tone: br[i] ? 'bad' : '' });
            if (br[i]) { o.on[k] = 'bad'; o.rows[k] = R_(['pedidos', 'relatorios', 'bff-app'][i], '', ['quebrou com a v2', 'bad']); } });
          o.cnt = C3(['CLIENTES QUEBRADOS', `${n} de 3`, n ? 'bad' : ''], ['QUANDO', 'em dias diferentes'], ['ONDE ESTÁ O CONTRATO', 'num e-mail', 'bad']);
          o.res = t > 6 ? ['repo único · pacote v1/v2', 'checagem de compatibilidade no CI'] : [];
          if (t > 6) T(o, 'K', 'conserto: repo único,\nv1/v2 e checagem no CI', 'acc'); } },
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
    lbl(s.rk || 'RESPOSTA', L0, 104);
    x.fillStyle = o.res.length ? acc : INK(); (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { if (/^(5|4)\d\d|^erro|nada volta/.test(l)) x.fillStyle = BAD(); fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(117 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    rest: () => `<table class="h3-sum"><tr><th></th><th>cabeçalhos</th><th>corpo</th><th>total</th></tr><tr><td>pedido</td><td>157 B</td><td>53 B</td><td><b>210 B</b></td></tr><tr><td>resposta 202</td><td>106 B</td><td>44 B</td><td><b>150 B</b></td></tr><tr class="on"><td>por chamada</td><td>263 B</td><td>97 B</td><td><b>360 B</b></td></tr></table>
      <li>Cadeia do 1050: gw → pedidos <b>5 ms</b>, reserva de estoque <b>20 ms</b>, pedidos → pagamentos <b>5 ms</b>, pagamentos → PSP <b>180 ms</b>: <b>210 ms</b>.</li><li>Em série, 3 serviços com 99,9% cada: 0,999³ = <b>99,70%</b>, <b>129 min/mês</b> fora (um só: 43 min). Com 4 saltos, 99,60% e 173 min.</li><li>POST e PATCH não são idempotentes; GET, HEAD, PUT e DELETE são (RFC 9110). Conserto do POST repetido: <b>Idempotency-Key</b> (rascunho IETF) ou PUT com id gerado pelo cliente.</li><li class="h3-dim">HTTP/1.1 sem TLS; com o mTLS da malha os bytes são os mesmos, cifrados. Os tempos são de exemplo.</li>`,
    rpc: () => `<li>A chamada: <b>Frete.Calcular(Args{Cep: "50050-000", PesoKg: 0.4})</b> → <b>15.00</b>, no serviço entregas.</li><li>Caminho: código → <b>stub</b> (serializa) → rede → <b>skeleton</b> (desserializa e chama) → função, e o mesmo de volta.</li><li>Lab: <b>Proteinas.Recomendacao</b>, porta <b>1234</b>, Peso 85 → <b>170 g/dia</b>; o cliente chama sem prazo nenhum.</li><li>net/rpc: codifica em <b>gob</b>, só fala com Go, pacote <b>congelado</b>. JSON-RPC 2.0: a mesma chamada em <b>93 B</b>.</li><li class="h3-dim">A fita mostra o conteúdo da mensagem gob, não os bytes um a um.</li>`,
    grpc: () => `<table class="h3-sum"><tr><th>quadros</th><th>1ª chamada</th><th>2ª em diante</th></tr><tr><td>cliente HEADERS</td><td>9 + 102</td><td>9 + 15</td></tr><tr><td>cliente DATA</td><td>9 + 16</td><td>9 + 16</td></tr><tr><td>servidor HEADERS</td><td>9 + 19</td><td>9 + 2</td></tr><tr><td>servidor DATA</td><td>9 + 23</td><td>9 + 23</td></tr><tr><td>trailers</td><td>9 + 24</td><td>9 + 2</td></tr><tr class="on"><td>total</td><td><b>136 + 93 = 229 B</b></td><td><b>49 + 54 = 103 B</b></td></tr></table>
      <li>REST: <b>360 B</b> em toda chamada. 360 ÷ 103 = <b>3,5×</b>. A 100 cobranças/s: 36 KB/s × 10,3 KB/s.</li><li>DATA = 5 B de prefixo do gRPC (1 de "comprimido?" + 4 de tamanho) + Protobuf: 11 B na ida, 18 na volta.</li><li>Cabeçalhos do grpc-go: :method, :scheme, :path, :authority, content-type <b>application/grpc+proto</b>, user-agent <b>grpc-go/1.62.1</b>, te: trailers, grpc-timeout (microssegundos restantes, muda a cada chamada). Trailers: <b>grpc-status: 0</b> e grpc-message vazio.</li><li class="h3-dim">Medido com grpc-go 1.62.1 e um proxy que lê os quadros, em loopback (:authority de 15 B; com pagamentos:50051, 1 B a mais). Fora da conta: o prefácio (24 B) e os SETTINGS (42 B) da conexão nova, e os PING e WINDOW_UPDATE do grpc-go. A 2ª chamada saiu com 102 B; da 3ª em diante, 103.</li>`,
    proto: () => `<table class="h3-sum"><tr><th>bytes</th><th>o que é</th></tr><tr><td>08</td><td>campo 1, varint (1 &lt;&lt; 3 | 0)</td></tr><tr><td>9a 08</td><td>1050 = 8 × 128 + 26</td></tr><tr><td>10</td><td>campo 2, varint</td></tr><tr><td>ca 16</td><td>2890 = 22 × 128 + 74</td></tr><tr><td>1a</td><td>campo 3, tamanho + bytes (3 &lt;&lt; 3 | 2)</td></tr><tr><td>03 70 69 78</td><td>3 bytes: "pix"</td></tr></table>
      <li>JSON <b>53 B</b> → Protobuf <b>11 B</b> (4,8× menor). Resposta: 44 B → <b>18 B</b> (0a 06 "c-7731" 12 08 "pendente").</li><li>Regra: nunca reusar número de campo; o que sai vira <b>reserved</b>. Dinheiro em <b>int64</b> de centavos, não double.</li>`,
    graphql: () => `<li>Consulta: <b>131 B</b> em POST /graphql; resposta: <b>201 B</b> com destaque, carrinho, recomendado e pedido (a forma do bff-app).</li><li>Sem BFF: 4 chamadas de 120 ms = 480 ms e 180 KB. Com GraphQL: 1 chamada do app.</li><li><b>N+1</b>: produtos(first: 20) com estoque → 1 + 20 = <b>21</b> chamadas; com DataLoader, <b>2</b>.</li><li>Outros riscos: consulta cara (10 itens × 5 níveis = 100.000 nós → limite de profundidade e de custo); uma rota só não usa o cache HTTP nem ETag; erros voltam com <b>status 200</b> e errors[] no corpo.</li>`,
    converge: () => `<table class="h3-sum"><tr><th>onde</th><th>protocolo</th><th>por quê</th></tr><tr><td>app, site, parceiro</td><td>REST/JSON (gw-loja)</td><td>todo cliente fala</td></tr><tr><td>formas diferentes dos dados</td><td>GraphQL</td><td>o cliente escolhe</td></tr><tr class="on"><td>serviço a serviço</td><td>gRPC + mTLS</td><td>contrato forte, 103 B</td></tr><tr><td>tempo real</td><td>WebSocket ou SSE</td><td>servidor empurra</td></tr><tr><td>terceiros</td><td>REST de saída, webhook de entrada</td><td>a língua do PSP</td></tr></table>
      <li>O gw-loja traduz <b>POST /api/v1/pedidos</b> em <b>Pedidos.Criar</b> (ex.: Envoy gRPC-JSON transcoder). Navegador só fala gRPC-Web.</li><li>Webhook do PSP às <b>14:05:23.43</b>: evento <b>ev-8812</b>, assinatura HMAC-SHA256, resposta 200 em ~30 ms.</li><li>Contratos: repositório único, versão no pacote (<b>v1</b>, <b>v2</b>), checagem de compatibilidade no CI.</li>`,
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
      <div class="i3-count" id="c3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk)}</b>${esc(s.yaml.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'chamada') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 220, -150), dist: innerWidth < 640 ? 14 : 17 } : { target: W(150, 220, 60), dist: 15.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · arraste para girar' };
})() });
