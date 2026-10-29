// Figura 3D (iso-glow): domínios. O pedido 1047 da Lena (outro gato de pelúcia, 79.90 + frete 15.00 = 94.90) visto por dentro dos domínios da loja.
// Cena: ao fundo, o mostrador com os números do passo e o dado real (o modelo do contexto, o código do agregado, o JSON do evento).
// Na frente, os contextos como ilhas com fronteira (a cerca acende) e, nos eventos, o barramento que corre na frente delas,
// com a linha do tempo dos eventos publicados (e-501 … e-504) logo abaixo.
// Cenários (toggle e ?mode=contextos|agregado|eventos|falha; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/microsservicos-brief.md).
FIGS3D.push({ id: 'dominio', name: 'Domains', mod: (() => {
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

  // ── cenários ──
  const SC = ['contextos', 'agregado', 'eventos', 'falha'];
  const SCNAME = { contextos: 'Contexts', agregado: 'Aggregate', eventos: 'Events', falha: 'Failure' };
  const SCFULL = { contextos: 'Bounded contexts', agregado: 'Order 1047 aggregate', eventos: 'Domain events', falha: 'Queue and repeated event' };
  const AULA = { contextos: 'aula-4-domain-driven-design', agregado: 'aula-5-ddd-conceitos-e-componentes',
    eventos: 'aula-8-case-da-loja-servicos-e-eventos', falha: 'aula-8-case-da-loja-servicos-e-eventos' };
  let clk = 0, sc = 'contextos', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; const a = +q.get('at'); if (a > 0) lt = a; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-dominio3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 10, FZ = PL + 1;
  plateWith(g0, 760, 400, [[14, 14], [746, 14], [14, 386], [746, 386]]);
  hazeAndShadow(g0, 380, 200, 9.2, 5.2);
  // mostrador ao fundo
  rbox(100, 12, PL, 560, 12, 148, 5, bodyMat, g0);
  const scr = faceCanvas('front', 104, 24, 152, 552, 135, 5, g0), SK = 552 / 460;   // o desenho do mostrador é feito em 460 × 112 e ampliado
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário
  function block(w, d, h, lab, sub) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    return { g, mat, top, fr, fh, w, d, h, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const IX = [16, 200, 384, 568], IY = 110, IW = 172, ID = 150, ICX = IX.map(x => x + IW / 2);
  const B = {
    cat: block(IW, ID, 34, 'CATALOG', 'context'), ped: block(IW, ID, 34, 'ORDERS', 'service'), pag: block(IW, ID, 34, 'PAYMENTS', 'context'),
    est: block(IW, ID, 34, 'STOCK', 'context'), ent: block(IW, ID, 34, 'SHIPPING', 'context'),
    root: block(200, 224, 40, 'ORDER 1047', 'root'), item: block(218, 72, 18, '', ''),
    end: block(218, 70, 18, '', ''), din: block(218, 70, 18, '', ''),   // os três de dentro têm o nome escrito em cima: a frente fica atrás do vizinho
    fora: block(124, 110, 30, 'OTHER CODE', ''), repo: block(128, 110, 30, 'REPOSITORY', ''),
  };
  const NAMES = Object.keys(B);
  const LAYI = (a, b, c, d) => ({ [a]: [IX[0], IY], [b]: [IX[1], IY], [c]: [IX[2], IY], [d]: [IX[3], IY] });
  const LAY = { contextos: LAYI('cat', 'est', 'ent', 'pag'), eventos: LAYI('ped', 'pag', 'est', 'ent'), falha: LAYI('ped', 'pag', 'est', 'ent'),
    agregado: { root: [160, 108], item: [372, 108], end: [372, 186], din: [372, 262], fora: [12, 160], repo: [620, 160] } };
  // eventos: cartões que saem do serviço e ficam na linha do tempo, à frente do barramento
  const TW = 164, TD = 28, TH = 5;
  const TILES = Array.from({ length: 6 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, TW, TD, TH, 3, mat, g); const top = faceCanvas('top', 1, 1, TH, TW - 2, TD - 2, 8, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // conexões grossas (vigas, cercas, barramento) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 80 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 6 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.th || (b.on ? 5.5 : 3.5)) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
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
  const TAGS = [tag(14), tag(14), tag(14)], MSGS = [tag(13), tag(13)];

  // ── rotas (no chão, z = 10) ──
  const FRONT = IY + ID, BUSY = 290, SLOTY = 322;
  const busR = (k, j) => [[ICX[k], FRONT + 2, Z], [ICX[k], BUSY, Z], [ICX[j], BUSY, Z], [ICX[j], FRONT + 2, Z]];
  const hopR = (k, j) => [[ICX[k], FRONT + 2, Z], [ICX[k], 278, Z], [ICX[j], 278, Z], [ICX[j], FRONT + 2, Z]];
  const BUS = [[22, BUSY, Z], [738, BUSY, Z]];
  const STUBS = () => ICX.map(x => ({ pts: [[x, FRONT + 2, Z], [x, BUSY, Z]], th: 4.5 }));
  const AG = { fence: [152, 100, 446, 240], fora2item: [[74, 270, Z], [74, 354, Z], [481, 354, Z], [481, 332, Z]], fora2root: [[74, 270, Z], [74, 354, Z], [260, 354, Z], [260, 332, Z]],
    root2repo: [[262, 332, Z], [262, 354, Z], [684, 354, Z], [684, 270, Z]] };
  const rev = pts => pts.slice().reverse();
  const fencePts = (x, y, w, d, m = 5) => [[x - m, y - m, FZ], [x + w + m, y - m, FZ], [x + w + m, y + d + m, FZ], [x - m, y + d + m, FZ], [x - m, y - m, FZ]];

  // ── conteúdo dos blocos (os mesmos dados do texto, do quiz e do glossário) ──
  const WAIT = [['the plush cat here is…', 6.8, 'dim'], ['?', 11.5, 'dim']];
  const CAT = [['model: product', 6.8, 'dim'], ['produto 42', 11.5, 'acc'], ['nome: gato de pelúcia', 7.4], ['preco: 79.90', 9.5], ['fotos: ["gato.jpg"]', 7.4], ['descricao: "…"', 7.4]];
  const EST = [['model: stock item', 6.8, 'dim'], ['SKU GATO-042', 11.5, 'acc'], ['quantidade: 3', 9.5], ['deposito: "SP-1"', 7.4], ['no photo, no price', 7.4, 'dim']];
  const ENT = [['model: parcel', 6.8, 'dim'], ['volume', 11.5, 'acc'], ['peso: 0.4 kg', 9.5], ['dimensoes: 30×20×15 cm', 7.4], ['destino: Recife', 7.4]];
  const PAG = [['model: charge', 6.8, 'dim'], ['pedido 1047', 11.5, 'acc'], ['valor: 94.90', 9.5], ['cat? no idea', 7.4, 'dim'], ['no name, no weight', 7.4, 'dim']];
  const ONE = [['one model for all 4', 6.8, 'dim'], ['Produto 42', 11.5, 'bad'], ['8 fields, 4 contexts', 7.4], ['preco, fotos, peso,', 7.4, 'dim'], ['quantidade, deposito…', 7.4, 'dim']];
  const rootRows = (status = 'pago', tn = '') => [['entity · root', 6.8, 'dim'], ['Pedido 1047', 11.5, 'acc'], ['cliente: Lena', 7.4], [`status: ${status}`, 9.5, tn],
    ['total: 94.90', 9.5], ['identity: id 1047', 7.4, 'dim'], ['cancelar()', 7.4, 'dim'], ['adicionarItem()', 7.4, 'dim']];
  const ITEM = [['ItemDoPedido · internal', 6.8, 'dim'], ['produto 42 · qtd 1', 9.5, 'acc'], ['preco: 79.90', 7.4]];
  const END = [['Address · value object', 6.8, 'dim'], ['Rua da Aurora, 100', 8.6, 'acc'], ['Recife · 50050-000', 7.4]];
  const DIN = [['Money · value object', 6.8, 'dim'], ['Dinheiro(94.90, "BRL")', 8.6, 'acc'], ['equal if the value is equal', 7.4, 'dim']];
  const FORA = [['outside the aggregate', 6.8, 'dim'], ['another module', 7.4], ['of the store', 7.4]];
  const REPO = [['PedidoRepository', 7.4, 'acc'], ['salvar(pedido)', 7.4], ['buscar(1047)', 7.4]];
  const pedRows = (st, tn = '') => [['owns the tables', 6.8, 'dim'], ['pedidos', 10.5, 'acc'], ['itens_pedido', 10.5, 'acc'], [`1047 · ${st}`, 8.4, tn]];
  const pagRows = (st, tn = '') => [['owns the table', 6.8, 'dim'], ['pagamentos', 10.5, 'acc'], [st, 8.4, tn]];
  const estRows = (q, tn = '', extra = '') => [['owns the table', 6.8, 'dim'], ['estoque', 10.5, 'acc'], [`GATO-042: ${q}`, 11, tn], ...(extra ? [[extra, 7.4, 'dim']] : [])];
  const entRows = (st, tn = '') => [['owns the table', 6.8, 'dim'], ['remessas', 10.5, 'acc'], [st, 8.4, tn]];
  const DOWN = [['owns the table', 6.8, 'dim'], ['DOWN', 12, 'bad'], ['process stopped', 7.4, 'dim'], ['the rest keeps going', 7.4, 'dim']];

  // ── dado real (o que o mostrador e o painel escrevem) ──
  const J = {
    cat: ['produto 42 {', '  nome: "gato de pelúcia",', '  preco: 79.90,', '  fotos: ["gato.jpg"],', '  descricao: "…"', '}'],
    est: ['SKU GATO-042 {', '  quantidade: 3,', '  deposito: "SP-1"', '}', '// no name, no price, no photo'],
    ent: ['volume {', '  peso: 0.4 kg,', '  dimensoes: "30×20×15 cm",', '  destino: "Recife"', '}', '// weighs and measures; the price does not matter'],
    pag: ['cobrança {', '  pedido_id: 1047,', '  valor: 94.90', '}', '// Payments does not know what a cat is'],
    mod: ['loja/                (one process, one deploy)', '  catalogo/    produto 42', '  estoque/     SKU GATO-042', '  entregas/    volume', '  pagamentos/  cobrança 1047',
      '// a folder only calls another one', '// through its public interface'],
    one: ['Produto 42 {           // one model for everyone', '  nome, preco, fotos, descricao,', '  quantidade, deposito,', '  peso, dimensoes', '}',
      '// Shipping wants weight in grams ✕', '// that changes everyone\'s class'],
    e501: ['PedidoCriado {', '  evento_id: "e-501", pedido_id: 1047,', '  cliente: "Lena",', '  itens: [{ produto: 42, qtd: 1, preco: 79.90 }],', '  frete: 15.00, total: 94.90', '}'],
    e502: ['PedidoPago {', '  evento_id: "e-502",', '  pedido_id: 1047, valor: 94.90', '}'],
    e503: ['EstoqueReservado {', '  evento_id: "e-503", sku: "GATO-042",', '  antes: 3, depois: 2', '}'],
    e504: ['PedidoEnviado {', '  evento_id: "e-504", pedido_id: 1047,', '  rastreio: "LA123456789BR"', '}'],
  };
  const EVN = { 'e-501': 'PedidoCriado', 'e-502': 'PedidoPago', 'e-503': 'EstoqueReservado', 'e-504': 'PedidoEnviado' };
  const EVT = { 'e-501': '14:02:10', 'e-502': '14:02:11', 'e-503': '14:02:11', 'e-504': '14:30:00' };

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const L = LAY[sc], o = { pos: { ...L }, on: {}, rows: {}, lab: {}, beams: [], fences: [], tags: [], msgs: [], tiles: [], k: [], jh: '', json: [] };
    if (sc === 'contextos') { o.rows = { cat: WAIT, est: WAIT, ent: WAIT, pag: WAIT }; ['cat', 'est', 'ent', 'pag'].forEach(nm => o.fences.push({ nm })); }
    if (sc === 'agregado') { o.rows = { root: rootRows(), item: ITEM, end: END, din: DIN, fora: FORA, repo: REPO }; o.fences.push({ box: AG.fence, m: 0 }); }
    if (sc === 'eventos' || sc === 'falha') {
      o.rows = { ped: pedRows('criado'), pag: pagRows('nada ainda', 'dim'), est: estRows(3), ent: entRows('nada ainda', 'dim') };
      ['ped', 'pag', 'est', 'ent'].forEach(nm => { o.fences.push({ nm }); o.lab[nm] = 'service'; });
      o.beams.push({ pts: BUS, th: 7 }, ...STUBS());
    }
    return o;
  }
  const T = (o, at, text, tone = 'acc', dx = 0) => o.tags.push([...(Array.isArray(at) ? at : [LAY[sc][at][0] + B[at].w / 2 + dx, 388, 16]), text, tone]);
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real; txt pode ser uma função da fração
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7, cut) {
    if (t < a) return false; const f = clamp((t - a) / (b - a)), fe = ease(f), lim = cut != null ? Math.min(fe, cut) : fe;
    const txt = typeof text === 'function' ? text(fe) : text;
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: lim < (cut != null ? cut : 1) ? lim : null, tone: tone === 'bad' ? 'bad' : '', cut: cut != null ? lim : null }); o.msgs.push([pts, lim, txt, tone]); }
    else o.beams.push({ pts, on: false, cut: cut != null ? cut : null, tone: tone === 'bad' ? 'bad' : '' });
    return f >= 1;
  }
  // o gato atravessa a fronteira entre dois contextos e muda de forma no meio do caminho
  function morph(o, t, a, b, k, j, A, Bt) {
    const pts = hopR(k, j), tot = cumLen(pts).at(-1), mid = (IX[k] + IW + IX[j]) / 2, fc = (pts[1][1] - pts[0][1] + mid - ICX[k]) / tot;
    return send(o, t, a, b, pts, fe => fe < fc ? A : Bt, 'acc', 1.2);
  }
  // um evento publicado: o cartão sai do serviço kFrom, cruza o barramento e para na vaga s da linha do tempo
  const slotC = s => [ICX[s], SLOTY, PL];
  function pub(o, t, a, kFrom, s, id, st = 'log', name, sub) {
    const label = `${id ? id + ' · ' : ''}${name || EVN[id]}`, sb = sub || EVT[id] || '';
    if (t < a) return false; const f = ease(clamp((t - a) / 0.9));
    const pts = [[ICX[kFrom], FRONT - 6, PL + 30], [ICX[kFrom], BUSY, PL + 12], [ICX[s], BUSY + 12, PL + 8], slotC(s)];
    o.tiles.push({ label, sub: sb, c: alongPts(pts, cumLen(pts), f), st: f < 1 || t < a + 1.6 ? 'on' : st }); return f >= 1;
  }
  const logT = (o, s, id, st = 'log', name, sub) => o.tiles.push({ label: `${id ? id + ' · ' : ''}${name || EVN[id]}`, sub: sub || EVT[id], c: slotC(s), st });
  const K = (o, ...rows) => { o.k = rows; };
  const JS = (o, h, lines) => { o.jh = h; o.json = lines; };
  const evK = (o, q, n, hora, qt = '') => K(o, ['STOCK GATO-042', String(q), qt], ['EVENTS PUBLISHED', `${n} of 4`], ['TIME', hora]);

  const STEPS = {
    contextos: [
      { id: 'catalogo', dur: 4, title: 'In Catalog, the plush cat is product 42',
        story: 'Lena is going to buy another plush cat, a gift for her brother. On the storefront, the cat is product 42: name, a price of 79.90, photos and a description. That is all Catalog needs to show and sell it. The rest of the store has not entered the story yet.',
        look: 'The Catalog island lights up with its fence around it. On top, the 4 fields of product 42; the other islands do not know what the cat is called yet.',
        key: 'Bounded context: a boundary inside which every word has a single meaning.',
        f(o, t) { o.rows.cat = CAT; o.on.cat = 1; o.fences[0].on = true; JS(o, 'MODEL IN CATALOG', J.cat);
          K(o, ['CONTEXT', 'Catalog'], ['THE PLUSH CAT HERE IS', 'produto 42', 'acc'], ['FIELDS', '4']);
          if (t > 1.2) T(o, 'cat', 'what is sold:\nname, price, photos'); } },
      { id: 'estoque', dur: 4.5, title: 'In Stock, the same cat is SKU GATO-042',
        story: 'Order 1047 will need a cat from the shelf. In Stock nobody talks about photos or descriptions: the cat is SKU GATO-042, with a quantity of 3 in warehouse SP-1. When it crosses the boundary, the data changes shape and keeps only what Stock uses.',
        look: 'The light dot leaves Catalog as product 42 and, past the fence, arrives at Stock as SKU GATO-042.',
        key: 'The same cat, another model: each context keeps only what it uses.',
        f(o, t) { o.rows.cat = CAT; o.on.cat = 2; JS(o, 'MODEL IN STOCK', J.est);
          K(o, ['CONTEXT', 'Stock'], ['THE PLUSH CAT HERE IS', 'SKU GATO-042', 'acc'], ['FIELDS', '2']);
          if (morph(o, t, 0.3, 1.8, 0, 1, 'produto 42', 'SKU GATO-042')) { o.rows.est = EST; o.on.est = 1; o.fences[1].on = true; }
          if (t > 2.2) T(o, 'est', 'what is counted:\nquantity 3, SP-1'); } },
      { id: 'entregas', dur: 4.5, title: 'In Shipping, the cat is a 0.4 kg parcel',
        story: 'To get the cat to Recife, Shipping needs weight and size: a parcel of 0.4 kg, 30×20×15 cm, destination Recife. The price does not help build the freight quote, so it is not in the model.',
        look: 'The light crosses the fence between Stock and Shipping and changes name: SKU GATO-042 becomes parcel 0.4 kg.',
        key: 'Ubiquitous language: each context speaks the language of the people who work in it.',
        f(o, t) { o.rows.cat = CAT; o.rows.est = EST; o.on.est = 2; JS(o, 'MODEL IN SHIPPING', J.ent);
          K(o, ['CONTEXT', 'Shipping'], ['THE PLUSH CAT HERE IS', 'parcel 0.4 kg', 'acc'], ['FIELDS', '3']);
          if (morph(o, t, 0.3, 1.8, 1, 2, 'SKU GATO-042', 'parcel 0.4 kg')) { o.rows.ent = ENT; o.on.ent = 1; o.fences[2].on = true; }
          if (t > 2.2) T(o, 'ent', 'what is shipped:\nweight, size, destination'); } },
      { id: 'pagamentos', dur: 4.5, title: 'In Payments, there is no cat',
        story: 'Payments charges order 1047: amount 94.90, the 79.90 for the cat plus 15.00 shipping. It does not know the product name, the weight or the warehouse, and it does not need to. For the one charging, an order is a number and an amount.',
        look: 'The light reaches Payments and the cat disappears: only pedido_id 1047 and valor 94.90 are left.',
        key: 'A context may not have the concept that another one has at its center.',
        f(o, t) { o.rows.cat = CAT; o.rows.est = EST; o.rows.ent = ENT; o.on.ent = 2; JS(o, 'MODEL IN PAYMENTS', J.pag);
          K(o, ['CONTEXT', 'Payments'], ['THE PLUSH CAT HERE IS', 'nothing', 'dim'], ['FIELDS', '2']);
          if (morph(o, t, 0.3, 1.8, 2, 3, 'parcel 0.4 kg', 'valor 94.90')) { o.rows.pag = PAG; o.on.pag = 1; o.fences[3].on = true; }
          if (t > 2.2) T(o, 'pag', 'only order and amount:\n1047 · 94.90'); } },
      { id: 'modular', dur: 4, title: 'Boundaries inside a single process',
        story: 'These boundaries do not require four services. Inside the loja program, each context can become a folder with a public interface, and a folder only talks to another one through it. That is the modular monolith: one process, one deploy, with the limits already drawn for when it needs to be split.',
        look: 'A larger fence wraps the four islands: the loja process. The fence of each context stays inside.',
        key: 'Modular monolith: the same DDD limits, still in a single process.',
        f(o, t) { o.rows = { cat: CAT, est: EST, ent: ENT, pag: PAG }; o.fences.forEach(F => { F.on = true; }); JS(o, 'MODULAR MONOLITH · FOLDERS', J.mod);
          K(o, ['PROCESSES', '1'], ['CONTEXTS', '4', 'acc'], ['DEPLOYS', '1']);
          if (t > 0.4) o.beams.push({ pts: fencePts(IX[0], IY, IX[3] + IW - IX[0], ID, 13), on: t > 0.4, th: 5 });
          if (t > 1.2) T(o, 'ent', 'loja process:\n4 folders with boundaries', 'acc', -92); } },
      { id: 'um-so', dur: 4.5, title: 'What if it goes wrong: one model for everyone',
        story: 'Without boundaries, a single Produto appears with everyone\'s fields: name, price, photos, description, quantity, warehouse, weight and dimensions. Payments receives photos it does not use. If Shipping wants the weight in grams, the change touches the class that Catalog and Stock also use, and the word "product" starts to mean three things.',
        look: 'The fences go dark and the four islands show the same Produto 42, in red, with 8 fields.',
        key: 'Without a bounded context, every change turns into a meeting with every team.',
        f(o, t) { const f = t > 0.6; o.rows = f ? { cat: ONE, est: ONE, ent: ONE, pag: ONE } : { cat: CAT, est: EST, ent: ENT, pag: PAG };
          o.fences.forEach(F => { F.on = !f; F.hide = f; }); if (f) ['cat', 'est', 'ent', 'pag'].forEach(nm => { o.on[nm] = 'bad'; });
          JS(o, 'ONE MODEL FOR EVERYONE', J.one); K(o, ['FIELDS IN THE MODEL', '8', 'bad'], ['WHO USES IT', '4 contexts'], ['BOUNDARIES', '0', 'bad']);
          if (t > 1.4) T(o, 'est', 'Single Produto: 8 fields\nchange one, hit all 4', 'bad', 92); } },
    ],
    agregado: [
      { id: 'raiz', dur: 4, title: 'Order 1047: the aggregate root',
        story: 'Lena\'s order is an entity: it has an identity, the id 1047, and it stays the same order even if something in it changes. It is the root of the Pedido aggregate. Everything that belongs to the order sits inside the same boundary and only changes by going through it.',
        look: 'The aggregate fence lights up around Order 1047 and the pieces that live with it; the Order, on the left, is the entry door.',
        key: 'Aggregate: a group of objects that changes together, with one root as the only door.',
        f(o, t) { o.on.root = 1; o.fences[0].on = true; o.on.item = 2; o.on.end = 2; o.on.din = 2;
          JS(o, 'THE PEDIDO AGGREGATE', ['class Pedido {                 // aggregate root', '  id = 1047                     // identity', '  cliente = "Lena"',
            '  itens = [ItemDoPedido(42, 1, 79.90)]', '  frete = Dinheiro(15.00, "BRL")', '  endereco = Endereco("Rua da Aurora, 100", …)', '}']);
          K(o, ['TOTAL', '94.90', 'acc'], ['ITEMS + SHIPPING', '79.90 + 15.00'], ['INVARIANT', 'ok']);
          if (t > 1.2) T(o, 'root', 'root: id 1047\nthe only entry door'); } },
      { id: 'item', dur: 4, title: 'The item lives inside the order',
        story: 'The cat entered the order as an ItemDoPedido: product 42, quantity 1, 79.90. The item does not live alone and nobody outside holds a reference to it. Whoever wants to add or change an item asks the Pedido, and the Pedido updates the total in the same step.',
        look: 'The ItemDoPedido lights up inside the fence, next to the root; the adicionarItem call arrives through the Pedido.',
        key: 'Inside the aggregate, only the root is reached from outside.',
        f(o, t) { o.fences[0].on = true; o.on.root = t < 1.4 ? 1 : 2; if (t > 1.0) o.on.item = 1;
          JS(o, 'ADDING AN ITEM', ['pedido.adicionarItem(produto: 42, qtd: 1)', '  → ItemDoPedido { produto: 42, qtd: 1,', '                  preco: 79.90 }', '  → total recalculated: 79.90 + 15.00 = 94.90 ✓', '', '// the item only exists inside Pedido 1047']);
          K(o, ['ITEMS', '1', 'acc'], ['ITEMS + SHIPPING', '79.90 + 15.00'], ['INVARIANT', 'ok']);
          if (t > 0.3) T(o, 'item', 'pedido.adicionarItem(42, 1)\nenters through the root'); } },
      { id: 'vo', dur: 4.5, title: 'Address and Money: value objects',
        story: 'Lena\'s address and the amount of 94.90 have no identity of their own: they are worth what they contain. Two Dinheiro(94.90, "BRL") are the same money. Nobody edits the street of an address: you swap the whole address, and the order is still 1047.',
        look: 'Address and Money light up inside the fence; on the screen, the comparison gives true because the values are equal.',
        key: 'Value object: equal if the values are equal; you swap it whole, you do not edit it.',
        f(o, t) { o.fences[0].on = true; o.on.root = 2; o.on.end = 1; o.on.din = 1;
          JS(o, 'VALUE OBJECTS', ['Dinheiro(94.90, "BRL") == Dinheiro(94.90, "BRL")', '  → true ✓  equal because the values are equal', '', 'Endereco { rua: "Rua da Aurora, 100",',
            '           cidade: "Recife", cep: "50050-000" }', '// address changed? swap the whole object;', '// the order is still 1047']);
          K(o, ['IDENTITY', 'only the Pedido', 'acc'], ['VALUE OBJECTS', '2'], ['INVARIANT', 'ok']);
          if (t > 0.8) T(o, 'din', 'worth their value:\nno id of their own'); } },
      { id: 'regra', dur: 4, title: 'The rule the aggregate protects: 79.90 + 15.00 = 94.90',
        story: 'The aggregate exists to guarantee a rule that is always true, the invariant: the total is the sum of the items plus shipping. 79.90 for the cat plus 15.00 shipping makes 94.90. Since everything goes through the root, there is no way to change an item and forget the total.',
        look: 'The root and the Money light up; the screen closes the sum 79.90 + 15.00 = 94.90 with a ✓.',
        key: 'Invariant: the rule that has to hold after any change to the aggregate.',
        f(o, t) { o.fences[0].on = true; o.on.root = 1; o.on.item = t > 0.6 ? 1 : 2; o.on.din = t > 1.2 ? 1 : 2; o.on.end = 2;
          JS(o, 'INVARIANT', ['total = sum of items + shipping', '      = 79.90 + 15.00', '      = 94.90 ✓', '', 'and one more Pedido rule:', '"an order that was already shipped cannot be cancelled"']);
          K(o, ['TOTAL', '94.90', 'acc'], ['ITEMS + SHIPPING', '79.90 + 15.00'], ['INVARIANT', 'ok ✓', 'acc']);
          if (t > 1.6) T(o, 'root', '79.90 + 15.00 = 94.90 ✓'); } },
      { id: 'barrado', dur: 5, title: 'Touching the item from outside: blocked',
        story: 'Another store module tries to grab the item and change the quantity directly: item.qtd = 2. If it got through, the items would add up to 159.80 and the total would stay 94.90, a sum that does not close. The aggregate boundary blocks the write; the right way is to ask the Pedido, which changes the item and the total together.',
        look: 'The red beam leaves Other Code and stops at the aggregate fence, before it reaches the item.',
        key: 'From outside, only the root: whoever skips the root breaks the invariant.',
        f(o, t) { o.fences[0].on = true; o.on.fora = t > 0.3 ? 'bad' : 0; o.on.root = 2;
          o.rows.fora = [['outside the aggregate', 6.8, 'dim'], ['item.qtd = 2', 9.5, 'bad'], ['straight on the item', 7.4, 'dim']];
          const cut = (cumLen(AG.fora2item).at(-1) - 24) / cumLen(AG.fora2item).at(-1);
          send(o, t, 0.4, 1.8, AG.fora2item, 'item.qtd = 2', 'bad', 0.3, cut);
          JS(o, 'WRITE FROM OUTSIDE', ['// other code, outside the aggregate:', 'item = pedido.itens[0]', 'item.qtd = 2                 ✕ refused', '// if it got through: items 159.80 + shipping 15.00',
            '//              ≠ total 94.90 (sum does not close)', '// right way: ask the Pedido, which changes', '// the item and recalculates the total together']);
          K(o, ['TOTAL', '94.90', 'acc'], ['ITEMS + SHIPPING', '79.90 + 15.00'], ['INVARIANT', t > 1.8 ? 'protected' : 'ok', 'acc']);
          if (t > 2.1) T(o, 'din', '✕ blocked at the boundary\nonly through the Pedido', 'bad', -30); } },
      { id: 'repo', dur: 5, title: 'Repository: the domain does not speak SQL',
        story: 'To store and fetch the whole order, the domain uses a repository: PedidoRepository.salvar(pedido) and buscar(1047). The repository is the one that writes the rows in pedidos and itens_pedido; the Pedido does not even know SQL exists. buscar(1047) returns the complete aggregate, with items and address.',
        look: 'The light goes from the Pedido to the Repository with salvar(pedido) and comes back with the whole Pedido 1047.',
        key: 'Repository: stores and returns whole aggregates, and hides the database from the domain.',
        f(o, t) { o.fences[0].on = true; o.on.root = 1;
          if (send(o, t, 0.3, 1.5, AG.root2repo, 'salvar(pedido)', 'acc', 0.3)) o.on.repo = 1;
          send(o, t, 2.4, 3.6, rev(AG.root2repo), 'buscar(1047) → Pedido 1047', 'acc', 1.4);
          JS(o, 'REPOSITORY', ['repo.salvar(pedido)', '  → INSERT INTO pedidos (id, cliente, total, …)', '  → INSERT INTO itens_pedido (pedido_id, produto, …)', '', 'repo.buscar(1047)',
            '  → a whole Pedido: items, address, total', '// the Pedido does not write SQL']);
          K(o, ['AGGREGATE', 'Pedido 1047', 'acc'], ['TABLES', 'pedidos, itens_pedido'], ['SQL IN THE DOMAIN', '0']);
          if (t > 1.6) T(o, 'repo', 'salvar · buscar', 'acc', -40); } },
      { id: 'anemico', dur: 5, title: 'What if it goes wrong: the anemic model',
        story: 'It is 14:30 and order 1047 has already shipped with tracking code LA123456789BR. In the anemic model the Pedido is just a bag of fields, and any code can write pedido.status = "cancelado". Nobody checks the rule: the cat is on its way to Recife and the system says the order was cancelled.',
        look: 'The red beam crosses the fence and reaches the root; the status switches from enviado to cancelado, in red.',
        key: 'Anemic: the rules are scattered across the callers, and someone forgets.',
        f(o, t) { o.fences[0].on = true; o.on.fora = t > 0.3 ? 'bad' : 0;
          o.rows.fora = [['outside the aggregate', 6.8, 'dim'], ['status =', 9.5, 'bad'], ['"cancelado"', 9.5, 'bad']];
          const done = send(o, t, 0.4, 1.8, AG.fora2root, 'pedido.status = "cancelado"', 'bad', 9);
          o.rows.root = done ? rootRows('cancelado ✕', 'bad') : rootRows('enviado'); o.on.root = done ? 'bad' : 2;
          JS(o, 'ANEMIC MODEL', ['// the Pedido is just a bag of fields', 'pedido.status                  // "enviado" (14:30)', 'pedido.status = "cancelado"    ✕ nobody stops it', '',
            '// the cat is on its way to Recife', '// and the order says cancelado']);
          K(o, ['STATUS', done ? 'cancelado' : 'enviado', done ? 'bad' : ''], ['TRACKING', 'LA123456789BR'], ['RULE', done ? 'ignored' : 'ok', done ? 'bad' : '']);
          if (t > 2) T(o, 'root', 'enviado → cancelado ✕\nnobody checked', 'bad', 20); } },
      { id: 'rico', dur: 5.5, title: 'The fix: pedido.cancelar() refuses',
        story: 'In the rich model, the status is not written from outside: whoever wants to cancel calls pedido.cancelar(), and the Pedido itself checks the rule. Since the status is enviado, it refuses. The rule lives in one place, next to the data it protects.',
        look: 'The cancelar() call reaches the root, which answers in red with the refusal; the status stays enviado.',
        key: 'Rich model: the object holds the rules and says no when the rule does not allow it.',
        f(o, t) { o.fences[0].on = true; o.rows.root = rootRows('enviado', 'acc'); o.on.fora = t > 0.3 && t < 3.2 ? 1 : 2;
          o.rows.fora = [['outside the aggregate', 6.8, 'dim'], ['pedido', 9.5, 'acc'], ['.cancelar()', 9.5, 'acc']];
          if (send(o, t, 0.4, 1.6, AG.fora2root, 'pedido.cancelar()', 'acc', 0.2)) o.on.root = 1;
          send(o, t, 2.0, 3.2, rev(AG.fora2root), 'refused: already shipped', 'bad', 1.6);
          JS(o, 'RICH MODEL', ['cancelar() {', '  if (this.status == "enviado")', '    throw "an order that was already shipped cannot be cancelled"', '  this.status = "cancelado"', '}', '',
            'pedido.cancelar()   ✕ refused · status: enviado ✓']);
          K(o, ['STATUS', 'enviado', 'acc'], ['TRACKING', 'LA123456789BR'], ['RULE', 'protected', 'acc']);
          if (t > 3.0) T(o, 'root', 'cancelar() refused\nstatus: enviado ✓', 'acc', 20); } },
    ],
    eventos: [
      { id: 'donos', dur: 5, title: 'Every table has an owner',
        story: 'The loja database was split up. Orders owns pedidos and itens_pedido, Payments owns pagamentos, Stock owns estoque and Shipping owns remessas (and Catalog, off screen, owns produtos). Nobody reads another service\'s table: whoever needs a piece of data asks the owner\'s API or listens to the event the owner publishes.',
        look: 'Each service shows its own tables. Shipping tries a direct SELECT on the Orders table and the red beam stops halfway.',
        key: 'Database per service: one table, one owner, and everyone else asks or listens.',
        f(o, t) { o.fences.forEach(F => { F.on = true; });
          o.on.ent = t > 0.3 && t < 3 ? 'bad' : 0; send(o, t, 0.4, 1.6, [[ICX[3], FRONT + 2, Z], [ICX[3], 274, Z], [ICX[0], 274, Z], [ICX[0], FRONT + 2, Z]], 'SELECT * FROM pedidos', 'bad', 9, 0.5);
          JS(o, 'TABLE OWNERS', ['produtos      → catalogo', 'pedidos       → pedidos', 'itens_pedido  → pedidos', 'estoque       → estoque', 'pagamentos    → pagamentos', 'remessas      → entregas',
            '// SELECT on someone else\'s table ✕', '// ask the API or listen to the event']);
          K(o, ['TABLES', '6'], ['OWNERS', '5 services', 'acc'], ['CROSS READS', 'forbidden', 'bad']);
          if (t > 1.7) T(o, 'pag', 'someone else\'s table ✕\nask or listen', 'bad', 92); } },
      { id: 'criado', dur: 5, title: '14:02:10 · PedidoCriado (e-501)',
        story: 'Lena completes the purchase. Orders writes order 1047 to its tables and publishes a domain event, a fact in the past tense in the language of the business: PedidoCriado, with items, shipping 15.00 and total 94.90. Orders does not call Payments; Payments listens and starts charging.',
        look: 'The e-501 card leaves Orders and stops on the timeline; over the bus, the PedidoCriado reaches Payments, which lights up.',
        key: 'Domain event: something that already happened, said in the language of the business.',
        f(o, t) { o.on.ped = t < 1.6 ? 1 : 2; o.fences[0].on = true; evK(o, 3, t > 1 ? 1 : 0, '14:02:10'); JS(o, 'EVENT e-501 · 14:02:10', J.e501);
          pub(o, t, 0.2, 0, 0, 'e-501');
          if (send(o, t, 1.2, 2.6, busR(0, 1), 'PedidoCriado e-501', 'acc', 0.4)) { o.on.pag = 1; o.fences[1].on = true; o.rows.pag = pagRows('charging 94.90'); }
          if (t > 3) T(o, 'pag', 'heard PedidoCriado:\ncharges 94.90'); } },
      { id: 'pago', dur: 5.5, title: '14:02:11 · PedidoPago (e-502)',
        story: 'The payment of 94.90 is approved. Payments writes to its table and publishes PedidoPago. Two services listen: Stock, which will reserve the cat, and Shipping, which can already prepare the shipment. Payments does not know who is listening and does not need to.',
        look: 'The e-502 card leaves Payments; over the bus, two light dots carry the PedidoPago to Stock and to Shipping.',
        key: 'The publisher does not know who listens: you can add more listeners without touching Payments.',
        f(o, t) { logT(o, 0, 'e-501'); o.rows.pag = pagRows('1047 · 94.90 approved', 'acc'); o.on.pag = t < 1.6 ? 1 : 2; o.fences[1].on = true;
          evK(o, 3, t > 1 ? 2 : 1, '14:02:11'); JS(o, 'EVENT e-502 · 14:02:11', J.e502);
          pub(o, t, 0.2, 1, 1, 'e-502');
          if (send(o, t, 1.2, 2.4, busR(1, 2), 'PedidoPago e-502', 'acc', 0.4)) { o.on.est = 1; o.fences[2].on = true; }
          if (send(o, t, 1.2, 2.8, busR(1, 3), 'PedidoPago e-502', 'acc', 0.4)) { o.on.ent = 1; o.fences[3].on = true; o.rows.ent = entRows('preparing 1047'); }
          if (t > 3.2) T(o, 'est', 'two listeners:\nStock and Shipping', 'acc', 92); } },
      { id: 'reservado', dur: 5, title: '14:02:11 · EstoqueReservado (e-503): 3 → 2',
        story: 'Stock receives the PedidoPago, sets one cat aside and lowers SKU GATO-042 from 3 to 2 in its table. Then it publishes EstoqueReservado with the before and the after. Orders listens and marks 1047 as reserved.',
        look: 'The Stock number drops from 3 to 2; the e-503 card enters the timeline and the light carries the event to Orders.',
        key: 'Each service changes only its own table and tells the others through an event.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.pag = pagRows('1047 · 94.90 approved', 'acc'); o.rows.ent = entRows('preparing 1047');
          const q = t > 0.8 ? 2 : 3; o.rows.est = estRows(q, t > 0.8 ? 'acc' : '', t > 0.8 ? 'before 3 · after 2' : ''); o.on.est = t < 2 ? 1 : 2; o.fences[2].on = true;
          evK(o, q, t > 1.4 ? 3 : 2, '14:02:11', t > 0.8 ? 'acc' : ''); JS(o, 'EVENT e-503 · 14:02:11', J.e503);
          pub(o, t, 0.6, 2, 2, 'e-503');
          if (send(o, t, 1.6, 3.0, busR(2, 0), 'EstoqueReservado e-503', 'acc', 0.4)) { o.on.ped = 1; o.fences[0].on = true; o.rows.ped = pedRows('pago · reservado'); }
          if (t > 1) T(o, 'est', 'GATO-042: 3 → 2'); } },
      { id: 'enviado', dur: 5, title: '14:30:00 · PedidoEnviado (e-504)',
        story: 'Half an hour later, Shipping dispatches the 0.4 kg parcel to Recife with tracking code LA123456789BR, writes to remessas and publishes PedidoEnviado. Orders listens and changes the status of 1047 to enviado. Four services, four tables, no cross reads.',
        look: 'The e-504 card completes the timeline; the light goes back over the bus to Orders, which shows enviado.',
        key: 'The whole purchase is a timeline of events: e-501, e-502, e-503, e-504.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); logT(o, 2, 'e-503'); o.rows.pag = pagRows('1047 · 94.90 approved', 'acc'); o.rows.est = estRows(2, 'acc', 'before 3 · after 2');
          o.rows.ped = pedRows('pago · reservado'); o.rows.ent = entRows('LA123456789BR', 'acc'); o.on.ent = t < 1.6 ? 1 : 2; o.fences[3].on = true;
          evK(o, 2, t > 1 ? 4 : 3, '14:30:00', 'acc'); JS(o, 'EVENT e-504 · 14:30:00', J.e504);
          pub(o, t, 0.2, 3, 3, 'e-504');
          if (send(o, t, 1.2, 2.8, busR(3, 0), 'PedidoEnviado e-504', 'acc', 0.4)) { o.on.ped = 1; o.fences[0].on = true; o.rows.ped = pedRows('enviado', 'acc'); }
          if (t > 3) T(o, 'ped', 'status: enviado'); } },
      { id: 'compensa', dur: 7, title: 'What if it goes wrong: stock was already 0',
        story: 'Go back to 14:02:11, but now with GATO-042 at 0. The payment of 94.90 was already approved and written to another database, so there is no single ROLLBACK that undoes everything. Stock publishes ReservaRecusada and Payments has to compensate: it refunds the 94.90 and publishes PagamentoEstornado. Coordinating these steps has a name, Saga, and it comes later.',
        look: 'Stock shows 0 in red; the refusal goes back over the bus to Payments, which refunds. The two new cards enter the timeline in red.',
        key: 'Between services, undoing means doing something else: a compensation.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.est = estRows(0, 'bad', 'nothing to reserve'); o.on.est = 'bad'; o.rows.pag = pagRows('1047 · 94.90 approved', 'acc');
          o.fences.forEach(F => { F.on = true; }); K(o, ['STOCK GATO-042', '0', 'bad'], ['PAYMENT', t > 3.4 ? 'refunded' : 'approved', t > 3.4 ? 'bad' : ''], ['ROLLBACK', 'does not exist', 'bad']);
          send(o, t, 0.2, 1.2, busR(1, 2), 'PedidoPago e-502', 'acc', 0.2);
          if (t > 1.2) { JS(o, 'COMPENSATION', ['ReservaRecusada {', '  pedido_id: 1047, sku: "GATO-042",', '  motivo: "estoque 0"            ✕', '}',
            'PagamentoEstornado {', '  pedido_id: 1047, valor: 94.90', '}']); pub(o, t, 1.3, 2, 2, '', 'bad', 'ReservaRecusada', 'stock 0'); }
          else JS(o, 'EVENT e-502 · 14:02:11', J.e502);
          if (send(o, t, 2.0, 3.2, busR(2, 1), 'ReservaRecusada', 'bad', 0.4)) { o.on.pag = 1; o.rows.pag = pagRows('1047 · refunded', 'bad'); }
          if (t > 3.4) pub(o, t, 3.4, 1, 3, '', 'bad', 'PagamentoEstornado', 'returns 94.90');
          if (t > 4.4) T(o, 'est', 'no ROLLBACK across databases:\nPayments compensates', 'bad', 92); } },
    ],
    falha: [
      { id: 'cai', dur: 6, title: 'Shipping goes down; the store keeps selling',
        story: 'Shipping is down. Lena pays anyway: Payments publishes PedidoPago, Stock listens and lowers GATO-042 from 3 to 2. The event meant for Shipping is not lost: it waits in its queue until it comes back.',
        look: 'Shipping goes dark with an X. The PedidoPago reaches Stock and stops in front of Shipping, where the e-502 card waits in the queue.',
        key: 'With events in a queue, a service that is down delays its own work without taking down the others.',
        f(o, t) { logT(o, 0, 'e-501'); o.rows.ent = DOWN; o.on.ent = 'bad'; o.fences[3].tone = 'bad'; o.fences[3].on = true; o.rows.pag = pagRows('1047 · 94.90 approved', 'acc');
          JS(o, 'EVENT e-502 · 14:02:11', J.e502); pub(o, t, 0.2, 1, 1, 'e-502');
          const got = send(o, t, 1.2, 2.4, busR(1, 2), 'PedidoPago e-502', 'acc', 0.4); if (got) { o.rows.est = estRows(2, 'acc', 'before 3 · after 2'); o.on.est = t < 3.4 ? 1 : 2; o.fences[2].on = true; }
          const qd = send(o, t, 1.2, 2.8, busR(1, 3), 'PedidoPago e-502', 'acc', 0.4, 0.84);
          if (qd) logT(o, 3, 'e-502', 'wait', 'queued', 'waiting for Shipping');
          if (got && t > 2.6) logT(o, 2, 'e-503');
          K(o, ['STOCK GATO-042', got ? '2' : '3', got ? 'acc' : ''], ['IN SHIPPING\'S QUEUE', qd ? '1' : '0', qd ? 'acc' : ''], ['SHIPPING', 'down', 'bad']);
          if (t > 3) T(o, 'ent', 'e-502 waiting\nin the queue', 'acc', -20); } },
      { id: 'volta', dur: 5.5, title: 'Shipping comes back and reads what stayed in the queue',
        story: 'Shipping comes back up and the first thing it does is read the queue: there is the PedidoPago e-502. It prepares the shipment, dispatches the cat and publishes PedidoEnviado with tracking code LA123456789BR. Nobody had to resend anything by hand.',
        look: 'The e-502 card moves from the queue into Shipping, which lights up; then e-504 enters the timeline.',
        key: 'The queue keeps the fact until the listener comes back.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); logT(o, 2, 'e-503'); o.rows.est = estRows(2, 'acc', 'before 3 · after 2'); o.rows.pag = pagRows('1047 · 94.90 approved', 'acc');
          o.on.ent = t > 0.3 ? 1 : 0; o.fences[3].on = true; o.rows.ent = t > 1.4 ? entRows('LA123456789BR', 'acc') : entRows('reading the queue…');
          if (t < 1.4) { const f = ease(clamp((t - 0.3) / 1)), pts = [slotC(3), [ICX[3], BUSY, PL + 12], [ICX[3], FRONT - 20, PL + 44]];
            o.tiles.push({ label: 'e-502 · PedidoPago', sub: 'leaving the queue', c: alongPts(pts, cumLen(pts), f), st: 'on' }); }
          if (t > 1.6) pub(o, t, 1.8, 3, 3, 'e-504');
          JS(o, t > 1.8 ? 'EVENT e-504 · 14:30:00' : 'READ FROM THE QUEUE', t > 1.8 ? J.e504 : J.e502);
          K(o, ['STOCK GATO-042', '2', 'acc'], ['IN SHIPPING\'S QUEUE', t > 1 ? '0' : '1'], ['SHIPPING', 'up', 'acc']);
          if (t > 2.6) T(o, 'ent', 'read e-502 from the queue\nshipped: e-504', 'acc', -20); } },
      { id: 'duplicado', dur: 6, title: 'What if it goes wrong: e-502 arrives twice',
        story: 'Stock processed the PedidoPago, but the acknowledgment got lost on the way. The queue thinks it was not received and delivers e-502 again. Without care, Stock lowers the stock again: 3 → 2 → 1. On the shelf there are 2 cats and the system says 1.',
        look: 'Two lights with the same e-502 reach Stock, one after the other; the number drops to 2 and then to 1, in red.',
        key: 'A queue delivers at least once: the same event can arrive repeated.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.pag = pagRows('1047 · 94.90 approved', 'acc'); o.fences[2].on = true;
          const a = send(o, t, 0.3, 1.3, busR(1, 2), 'PedidoPago e-502', 'acc', 0.2), b = send(o, t, 2.0, 3.0, busR(1, 2), 'e-502 again', 'bad', 0.6);
          const q = b ? 1 : a ? 2 : 3; o.rows.est = estRows(q, b ? 'bad' : a ? 'acc' : '', b ? '3 → 2 → 1 ✕' : a ? '3 → 2' : ''); o.on.est = b ? 'bad' : a ? 1 : 0;
          if (b) o.fences[2].tone = 'bad';
          JS(o, 'WITHOUT IDEMPOTENCY', ['on receiving PedidoPago:', '  estoque["GATO-042"] -= 1', '', `1st delivery of e-502 → ${a ? '3 → 2' : '…'}`, `2nd delivery of e-502 → ${b ? '2 → 1  ✕' : '…'}`,
            '// on the shelf: 2 cats · in the system: ' + (b ? '1 ✕' : '…')]);
          K(o, ['STOCK GATO-042', String(q), b ? 'bad' : ''], ['e-502 DELIVERIES', b ? '2' : a ? '1' : '0', b ? 'bad' : ''], ['ON THE SHELF', '2']);
          if (t > 3.2) T(o, 'est', 'e-502 twice:\n3 → 2 → 1 ✕', 'bad'); } },
      { id: 'idempotente', dur: 6, title: 'The fix: keep the evento_id of everything already processed',
        story: 'Stock starts noting the evento_id of everything it has already processed. The first delivery of e-502 lowers 3 to 2 and notes e-502. When the same e-502 arrives again, it checks the list, sees it already did it and ignores it. Stock stays at 2, matching the shelf. This care is called idempotency and comes back in a later module.',
        look: 'The second e-502 light hits Stock and comes back in red as ignored; the number stays at 2.',
        key: 'Idempotent: processing the same event twice gives the same result as once.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.pag = pagRows('1047 · 94.90 approved', 'acc'); o.fences[2].on = true;
          const a = send(o, t, 0.3, 1.3, busR(1, 2), 'PedidoPago e-502', 'acc', 0.2), b = send(o, t, 2.0, 3.0, busR(1, 2), 'e-502 again', 'bad', 0.1);
          if (b) send(o, t, 3.1, 4.1, busR(2, 1), 'already processed: ignore', 'bad', 1.2, 0.35);
          o.rows.est = estRows(a ? 2 : 3, a ? 'acc' : '', a ? 'processed: e-502' : 'processed: none'); o.on.est = a ? 1 : 0;
          JS(o, 'WITH IDEMPOTENCY', ['on receiving PedidoPago:', '  if (processados.has(evento_id)) return  // ignore', '  estoque["GATO-042"] -= 1', '  processados.add(evento_id)', '',
            `1st delivery of e-502 → ${a ? '3 → 2 ✓' : '…'}`, `2nd delivery of e-502 → ${b ? 'ignored, stays 2 ✓' : '…'}`]);
          K(o, ['STOCK GATO-042', a ? '2' : '3', a ? 'acc' : ''], ['e-502 DELIVERIES', b ? '2' : a ? '1' : '0'], ['PROCESSED', a ? 'e-502' : '—', 'acc']);
          if (t > 3.4) T(o, 'est', 'e-502 already processed:\nstays 2 ✓', 'acc'); } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawBlock(Bk, rows, on, nm, sub0) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
      let y = 6; x.textAlign = 'left';   // nenhuma linha abaixo de ~10 unidades: texto fino some no tema claro
      for (const r of rows) { const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.6, lh = s * 1.42; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      if (rows === DOWN) { x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(W_ - 40), u(10)); x.lineTo(u(W_ - 12), u(38)); x.moveTo(u(W_ - 12), u(10)); x.lineTo(u(W_ - 40), u(38)); x.stroke(); }
      cv.tex.needsUpdate = true; }
    const lab = Bk.lab, sub = sub0 != null ? sub0 : Bk.sub;
    if (!lab) { Bk.fr.mesh.visible = false; Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0; return; }
    const fk = lab + sub + (on === 1) + (on === 'bad') + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(), Wf = cv.c.width / P; x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; fitFont(x, u, lab, big, Wf - 6); x.fillText(lab, u(3), u(mid));
      const lw = x.measureText(lab).width / P, room = Wf - 11 - lw;
      if (sub) { x.font = `700 ${u(9)}px ${MONO3}`; const sw = x.measureText(sub).width / P, s = Math.min(9, 9 * room / sw);
        if (s >= 6.6) { x.fillStyle = INK(); x.font = `700 ${u(s)}px ${MONO3}`; x.fillText(sub, u(8 + lw), u(mid)); } }
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  function drawTile(T_, d) {
    const key = JSON.stringify([d.label, d.sub, d.st]) + theme + accent.getHex(); if (T_.key === key) return; T_.key = key;
    const cv = T_.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', st = d.st, on = st === 'on', bad = st === 'bad', wait = st === 'wait';
    x.clearRect(0, 0, cv.c.width, cv.c.height);
    x.fillStyle = bad ? (light ? '#f4e4e2' : '#24130f') : on || wait ? (light ? '#f6ece2' : '#2a1d12') : (light ? '#eeeeed' : '#17181a'); x.fillRect(0, 0, cv.c.width, cv.c.height);
    if (wait) x.setLineDash([u(3), u(2)]);
    x.strokeStyle = bad ? BAD() : on || wait ? accC() : C.line; x.lineWidth = u(on || bad || wait ? 1.4 : 0.6); x.strokeRect(u(0.8), u(0.8), cv.c.width - u(1.6), cv.c.height - u(1.6)); x.setLineDash([]);
    const Wt = cv.c.width / P;
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = bad ? BAD() : on || wait ? accC() : C.inkHi; fitFont(x, u, d.label, 11, Wt - 8); x.fillText(d.label, u(4), u(8.6));
    x.fillStyle = bad ? BAD() : INK(); fitFont(x, u, d.sub || '', 8.4, Wt - 8); x.fillText(d.sub || '', u(4), u(19.4));
    cv.tex.needsUpdate = true; T_.mat.emissiveIntensity = on ? 0.9 : wait ? 0.45 : 0;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.k, o.jh, o.json, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 7.8, mw); x.fillText(t, u(X), u(Y)); };
    o.k.slice(0, 3).forEach(([lab, val, tn], i) => { lbl(lab, 8, 9 + i * 36);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'acc' ? acc : tn === 'dim' ? INK() : C.inkHi; fitFont(x, u, val, 17, 142); x.fillText(val, u(8), u(25 + i * 36)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(106)); x.stroke();
    lbl('REAL DATA · ' + o.jh, L0, 9, 286);
    const n = o.json.length, fs = n > 6 ? 8.4 : 9.2, lh = n > 6 ? 10.8 : 12.4;
    o.json.slice(0, 8).forEach((l, i) => { x.fillStyle = l.includes('✕') ? BAD() : l.includes('✓') ? acc : l.trim().startsWith('//') ? INK() : C.inkHi;
      fitFont(x, u, l, fs, 288); x.fillText(l, u(L0), u(23 + i * lh)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Order, names, times and numbers are the module\'s example (the store and Lena\'s order 1047), written the way a real system would write them.</li>';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const DATA = {
    contextos: () => `<table class="h3-sum"><tr><th>context</th><th>the plush cat is</th><th>fields</th></tr><tr><td>Catalog</td><td>produto 42</td><td>nome, preco 79.90, fotos, descricao</td></tr>
      <tr><td>Stock</td><td>SKU GATO-042</td><td>quantidade 3, deposito SP-1</td></tr><tr><td>Shipping</td><td>volume</td><td>peso 0.4 kg, 30×20×15 cm, destino Recife</td></tr>
      <tr><td>Payments</td><td>(nothing)</td><td>pedido_id 1047, valor 94.90</td></tr></table>
      <li><b>Ubiquitous language</b>: inside each context, the code uses the same words the team uses in conversation (SKU in Stock, parcel in Shipping).</li>
      <li><b>Modular monolith</b>: the same boundaries become folders with a public interface inside the loja process, before they become services.</li>
      <li>One model for everyone would have <b>8 fields</b> used by 4 contexts, and every change would affect all 4.</li>${EX}`,
    agregado: () => `<li><b>Pedido 1047</b> (root, entity): cliente Lena, itens, frete, endereco, total</li><li><b>ItemDoPedido</b>: produto 42, qtd 1, 79.90 (only changes through the Pedido)</li>
      <li><b>Value objects</b>: Endereco { rua: "Rua da Aurora, 100", cidade: "Recife", cep: "50050-000" } and Dinheiro(94.90, "BRL")</li>
      <li><b>Invariants</b>: total = sum of items + shipping (79.90 + 15.00 = <b>94.90</b>) and "an order that was already shipped cannot be cancelled"</li>
      <li><b>Repository</b>: PedidoRepository.salvar(pedido) and buscar(1047); the SQL stays with it</li>
      <table class="h3-sum"><tr><th>model</th><th>cancel shipped order 1047</th><th>result</th></tr><tr><td>anemic</td><td>pedido.status = "cancelado"</td><td>accepted ✕</td></tr><tr class="on"><td>rich</td><td>pedido.cancelar()</td><td>refused ✓</td></tr></table>${EX}`,
    eventos: () => `<table class="h3-sum"><tr><th>time</th><th>event</th><th>who listens</th></tr><tr><td>14:02:10</td><td>PedidoCriado e-501</td><td>pagamentos</td></tr>
      <tr><td>14:02:11</td><td>PedidoPago e-502</td><td>estoque, entregas</td></tr><tr><td>14:02:11</td><td>EstoqueReservado e-503</td><td>pedidos</td></tr><tr><td>14:30:00</td><td>PedidoEnviado e-504</td><td>pedidos</td></tr></table>
      <li>Owners: produtos → catalogo · pedidos + itens_pedido → pedidos · estoque → estoque · pagamentos → pagamentos · remessas → entregas</li>
      <li>GATO-042: <b>3 → 2</b> in EstoqueReservado (e-503)</li>
      <li>Stock at 0: there is no ROLLBACK across databases; Payments compensates with a refund of <b>94.90</b> (coordinating that is a Saga, a topic for later)</li>
      <li>Order 1047 passes through several services and each one writes its own log; the same <b>trace_id=7f3a…</b> in all of them ties the pieces together.</li>${EX}`,
    falha: () => `<table class="h3-sum"><tr><th>delivery of e-502</th><th>without idempotency</th><th>with idempotency</th></tr><tr><td>1st</td><td>3 → 2</td><td>3 → 2, notes e-502</td></tr>
      <tr class="on"><td>2nd (repeat)</td><td>2 → 1 ✕</td><td>ignored, stays 2 ✓</td></tr></table>
      <li>Shipping down: <b>PedidoPago e-502</b> waits in the queue and is delivered when it comes back; then PedidoEnviado e-504 goes out (LA123456789BR).</li>
      <li>Why it repeats: the queue delivers <b>at least once</b>; if the acknowledgment is lost, it delivers again.</li>
      <li>Fix: Stock keeps the <b>evento_id</b> of everything already processed and ignores the repeat (idempotency, covered in depth in a later module).</li>${EX}`,
  };
  function countHtml() { const o = SP || spec(), k = o.k; if (!k.length) return '';
    const [l0, v0, t0] = k[0]; return `<b${t0 === 'bad' ? ' class="bad"' : ''}>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span><i>${k.slice(1).map(([l, v]) => `· ${esc(l.toLowerCase())}: ${esc(v)}`).join(' ')}</i>`; }
  const jsonHtml = o => `<b>Real data · ${esc(o.jh.toLowerCase())}</b>${o.json.map(l => l.includes('✕') ? `<span class="bad">${esc(l)}</span>` : esc(l)).join('\n')}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="d3count">${countHtml()}</div>
      <div class="i3-sql" id="d3json">${jsonHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one line</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'dominio') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.k.map(([l, v]) => `${l.toLowerCase()} ${v}`).join(' · ')}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'dominio' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-dominio3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'dominio') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], p = o.pos[nm], vis = !!p;
      Bk.g.visible = vis; if (!vis) { Bk.pos = null; return; }
      const want = [p[0], p[1], PL];
      if (!Bk.pos) { Bk.pos = want.slice(); Bk.to = want; Bk.from = want; }
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      drawBlock(Bk, o.rows[nm] || [], o.on[nm] || 0, nm, o.lab[nm]); });
    // cercas: seguem o bloco (que pode estar deslizando entre um cenário e outro)
    const fb = o.fences.filter(F => !F.hide).map(F => { const box = F.box || [B[F.nm].pos[0], B[F.nm].pos[1], B[F.nm].w, B[F.nm].d];
      return { pts: fencePts(...box, F.m != null ? F.m : 5), on: !!F.on, tone: F.tone, th: F.on ? 4.2 : 3 }; });
    setBeams([...fb, ...o.beams]); drawScreen(o);
    TILES.forEach((T_, i) => { const d = o.tiles[i];
      if (!d) { T_.g.visible = false; T_.glow.material.uniforms.intensity.value = 0; return; }
      T_.g.visible = true; T_.g.position.copy(W(d.c[0] - TW / 2, d.c[1] - TD / 2, d.c[2])); drawTile(T_, d);
      moveGlow(T_.glow, [d.c[0], d.c[1], d.c[2] + TH + 2], d.st === 'on' ? 0.9 : d.st === 'wait' ? 0.5 : 0); });
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), tot = cum.at(-1), p = alongPts(m[0], cum, Math.min(m[1], (tot - 30) / tot));   // o balão para antes de cobrir o nome do bloco
      t.set(m[2], m[3]).at(p[0], p[1], 36); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('d3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.getElementById('d3json'), sh = jsonHtml(SP); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 760, 8, 400];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.9 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.78 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
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
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr]), ...TILES.map(T_ => T_.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; }); TILES.forEach(T_ => { T_.key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(380, 200, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(100, 200, 60), dist: 14 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
