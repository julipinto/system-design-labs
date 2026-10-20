// Figura 3D (iso-glow): domínios. O pedido 1047 da Lena (outro gato de pelúcia, 79.90 + frete 15.00 = 94.90) visto por dentro dos domínios da loja.
// Cena: ao fundo, o mostrador com os números do passo e o dado real (o modelo do contexto, o código do agregado, o JSON do evento).
// Na frente, os contextos como ilhas com fronteira (a cerca acende) e, nos eventos, o barramento que corre na frente delas,
// com a linha do tempo dos eventos publicados (e-501 … e-504) logo abaixo.
// Cenários (toggle e ?mode=contextos|agregado|eventos|falha; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/microsservicos-brief.md).
FIGS3D.push({ id: 'dominio', name: 'Domínios', mod: (() => {
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
  const SCNAME = { contextos: 'Contextos', agregado: 'Agregado', eventos: 'Eventos', falha: 'Falha' };
  const SCFULL = { contextos: 'Contextos delimitados', agregado: 'Agregado Pedido 1047', eventos: 'Eventos de domínio', falha: 'Fila e evento repetido' };
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
    cat: block(IW, ID, 34, 'CATÁLOGO', 'contexto'), ped: block(IW, ID, 34, 'PEDIDOS', 'serviço'), pag: block(IW, ID, 34, 'PAGAMENTOS', 'contexto'),
    est: block(IW, ID, 34, 'ESTOQUE', 'contexto'), ent: block(IW, ID, 34, 'ENTREGAS', 'contexto'),
    root: block(200, 224, 40, 'PEDIDO 1047', 'raiz'), item: block(218, 72, 18, '', ''),
    end: block(218, 70, 18, '', ''), din: block(218, 70, 18, '', ''),   // os três de dentro têm o nome escrito em cima: a frente fica atrás do vizinho
    fora: block(124, 110, 30, 'OUTRO CÓDIGO', ''), repo: block(128, 110, 30, 'REPOSITÓRIO', ''),
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
  const WAIT = [['o gato aqui é…', 6.8, 'dim'], ['?', 11.5, 'dim']];
  const CAT = [['modelo: produto', 6.8, 'dim'], ['produto 42', 11.5, 'acc'], ['nome: gato de pelúcia', 7.4], ['preco: 79.90', 9.5], ['fotos: ["gato.jpg"]', 7.4], ['descricao: "…"', 7.4]];
  const EST = [['modelo: item de estoque', 6.8, 'dim'], ['SKU GATO-042', 11.5, 'acc'], ['quantidade: 3', 9.5], ['deposito: "SP-1"', 7.4], ['sem foto, sem preço', 7.4, 'dim']];
  const ENT = [['modelo: volume', 6.8, 'dim'], ['volume', 11.5, 'acc'], ['peso: 0.4 kg', 9.5], ['dimensoes: 30×20×15 cm', 7.4], ['destino: Recife', 7.4]];
  const PAG = [['modelo: cobrança', 6.8, 'dim'], ['pedido 1047', 11.5, 'acc'], ['valor: 94.90', 9.5], ['gato? não sabe', 7.4, 'dim'], ['nem nome, nem peso', 7.4, 'dim']];
  const ONE = [['o mesmo modelo para os 4', 6.8, 'dim'], ['Produto 42', 11.5, 'bad'], ['8 campos, 4 contextos', 7.4], ['preco, fotos, peso,', 7.4, 'dim'], ['quantidade, deposito…', 7.4, 'dim']];
  const rootRows = (status = 'pago', tn = '') => [['entidade · raiz', 6.8, 'dim'], ['Pedido 1047', 11.5, 'acc'], ['cliente: Lena', 7.4], [`status: ${status}`, 9.5, tn],
    ['total: 94.90', 9.5], ['identidade: id 1047', 7.4, 'dim'], ['cancelar()', 7.4, 'dim'], ['adicionarItem()', 7.4, 'dim']];
  const ITEM = [['ItemDoPedido · interno', 6.8, 'dim'], ['produto 42 · qtd 1', 9.5, 'acc'], ['preco: 79.90', 7.4]];
  const END = [['Endereço · value object', 6.8, 'dim'], ['Rua da Aurora, 100', 8.6, 'acc'], ['Recife · 50050-000', 7.4]];
  const DIN = [['Dinheiro · value object', 6.8, 'dim'], ['Dinheiro(94.90, "BRL")', 8.6, 'acc'], ['igual se o valor é igual', 7.4, 'dim']];
  const FORA = [['fora do agregado', 6.8, 'dim'], ['outro módulo', 7.4], ['da loja', 7.4]];
  const REPO = [['PedidoRepository', 7.4, 'acc'], ['salvar(pedido)', 7.4], ['buscar(1047)', 7.4]];
  const pedRows = (st, tn = '') => [['dono das tabelas', 6.8, 'dim'], ['pedidos', 10.5, 'acc'], ['itens_pedido', 10.5, 'acc'], [`1047 · ${st}`, 8.4, tn]];
  const pagRows = (st, tn = '') => [['dono da tabela', 6.8, 'dim'], ['pagamentos', 10.5, 'acc'], [st, 8.4, tn]];
  const estRows = (q, tn = '', extra = '') => [['dono da tabela', 6.8, 'dim'], ['estoque', 10.5, 'acc'], [`GATO-042: ${q}`, 11, tn], ...(extra ? [[extra, 7.4, 'dim']] : [])];
  const entRows = (st, tn = '') => [['dono da tabela', 6.8, 'dim'], ['remessas', 10.5, 'acc'], [st, 8.4, tn]];
  const DOWN = [['dono da tabela', 6.8, 'dim'], ['FORA DO AR', 12, 'bad'], ['processo parado', 7.4, 'dim'], ['o resto segue', 7.4, 'dim']];

  // ── dado real (o que o mostrador e o painel escrevem) ──
  const J = {
    cat: ['produto 42 {', '  nome: "gato de pelúcia",', '  preco: 79.90,', '  fotos: ["gato.jpg"],', '  descricao: "…"', '}'],
    est: ['SKU GATO-042 {', '  quantidade: 3,', '  deposito: "SP-1"', '}', '// sem nome, sem preço, sem foto'],
    ent: ['volume {', '  peso: 0.4 kg,', '  dimensoes: "30×20×15 cm",', '  destino: "Recife"', '}', '// pesa e mede; o preço não importa'],
    pag: ['cobrança {', '  pedido_id: 1047,', '  valor: 94.90', '}', '// Pagamentos não sabe o que é gato'],
    mod: ['loja/                (um processo, um deploy)', '  catalogo/    produto 42', '  estoque/     SKU GATO-042', '  entregas/    volume', '  pagamentos/  cobrança 1047',
      '// uma pasta só chama a outra pela', '// interface pública dela'],
    one: ['Produto 42 {           // um modelo para todos', '  nome, preco, fotos, descricao,', '  quantidade, deposito,', '  peso, dimensoes', '}',
      '// Entregas quer peso em gramas ✕', '// muda a classe de todo mundo'],
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
      ['ped', 'pag', 'est', 'ent'].forEach(nm => { o.fences.push({ nm }); o.lab[nm] = 'serviço'; });
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
  const evK = (o, q, n, hora, qt = '') => K(o, ['ESTOQUE GATO-042', String(q), qt], ['EVENTOS PUBLICADOS', `${n} de 4`], ['HORA', hora]);

  const STEPS = {
    contextos: [
      { id: 'catalogo', dur: 4, title: 'No Catálogo, o gato é o produto 42',
        story: 'A Lena vai comprar outro gato de pelúcia, presente para o irmão. Na vitrine, o gato é o produto 42: nome, preço de 79.90, fotos e descrição. É tudo o que o Catálogo precisa para mostrar e vender. O resto da loja ainda não entrou na história.',
        look: 'A ilha do Catálogo acende com a cerca em volta. Em cima dela, os 4 campos do produto 42; as outras ilhas ainda não sabem como chamam o gato.',
        key: 'Contexto delimitado: uma fronteira dentro da qual cada palavra tem um sentido só.',
        f(o, t) { o.rows.cat = CAT; o.on.cat = 1; o.fences[0].on = true; JS(o, 'MODELO NO CATÁLOGO', J.cat);
          K(o, ['CONTEXTO', 'Catálogo'], ['O GATO AQUI É', 'produto 42', 'acc'], ['CAMPOS', '4']);
          if (t > 1.2) T(o, 'cat', 'o que se vende:\nnome, preço, fotos'); } },
      { id: 'estoque', dur: 4.5, title: 'No Estoque, o mesmo gato é o SKU GATO-042',
        story: 'O pedido 1047 vai precisar de um gato da prateleira. No Estoque ninguém fala em foto ou descrição: o gato é o SKU GATO-042, com quantidade 3 no depósito SP-1. Ao cruzar a fronteira, o dado muda de forma e fica só com o que o Estoque usa.',
        look: 'O ponto de luz sai do Catálogo como produto 42 e, ao passar a cerca, chega ao Estoque como SKU GATO-042.',
        key: 'O mesmo gato, outro modelo: cada contexto guarda só o que usa.',
        f(o, t) { o.rows.cat = CAT; o.on.cat = 2; JS(o, 'MODELO NO ESTOQUE', J.est);
          K(o, ['CONTEXTO', 'Estoque'], ['O GATO AQUI É', 'SKU GATO-042', 'acc'], ['CAMPOS', '2']);
          if (morph(o, t, 0.3, 1.8, 0, 1, 'produto 42', 'SKU GATO-042')) { o.rows.est = EST; o.on.est = 1; o.fences[1].on = true; }
          if (t > 2.2) T(o, 'est', 'o que se conta:\nquantidade 3, SP-1'); } },
      { id: 'entregas', dur: 4.5, title: 'Em Entregas, o gato é um volume de 0,4 kg',
        story: 'Para levar o gato até Recife, Entregas quer saber de peso e tamanho: um volume de 0,4 kg, 30×20×15 cm, destino Recife. O preço não ajuda a montar o frete e não entra no modelo.',
        look: 'A luz cruza a cerca entre Estoque e Entregas e troca de nome: SKU GATO-042 vira volume 0.4 kg.',
        key: 'Linguagem ubíqua: cada contexto fala a língua de quem trabalha nele.',
        f(o, t) { o.rows.cat = CAT; o.rows.est = EST; o.on.est = 2; JS(o, 'MODELO EM ENTREGAS', J.ent);
          K(o, ['CONTEXTO', 'Entregas'], ['O GATO AQUI É', 'volume 0.4 kg', 'acc'], ['CAMPOS', '3']);
          if (morph(o, t, 0.3, 1.8, 1, 2, 'SKU GATO-042', 'volume 0.4 kg')) { o.rows.ent = ENT; o.on.ent = 1; o.fences[2].on = true; }
          if (t > 2.2) T(o, 'ent', 'o que se transporta:\npeso, medidas, destino'); } },
      { id: 'pagamentos', dur: 4.5, title: 'Em Pagamentos, não existe gato',
        story: 'Pagamentos cobra o pedido 1047: valor 94.90, os 79.90 do gato mais 15.00 de frete. Não sabe o nome do produto, o peso nem o depósito, e nem precisa. Para quem cobra, o pedido é um número e um valor.',
        look: 'A luz chega a Pagamentos e o gato some: sobram pedido_id 1047 e valor 94.90.',
        key: 'Um contexto pode não ter o conceito que outro tem no centro.',
        f(o, t) { o.rows.cat = CAT; o.rows.est = EST; o.rows.ent = ENT; o.on.ent = 2; JS(o, 'MODELO EM PAGAMENTOS', J.pag);
          K(o, ['CONTEXTO', 'Pagamentos'], ['O GATO AQUI É', 'nada', 'dim'], ['CAMPOS', '2']);
          if (morph(o, t, 0.3, 1.8, 2, 3, 'volume 0.4 kg', 'valor 94.90')) { o.rows.pag = PAG; o.on.pag = 1; o.fences[3].on = true; }
          if (t > 2.2) T(o, 'pag', 'só pedido e valor:\n1047 · 94.90'); } },
      { id: 'modular', dur: 4, title: 'Fronteiras dentro de um processo só',
        story: 'Essas fronteiras não exigem quatro serviços. Dentro do programa loja, cada contexto pode virar uma pasta com interface pública, e uma pasta só conversa com a outra por ela. É o monolito modular: um processo, um deploy, os limites já desenhados para quando precisar partir.',
        look: 'Uma cerca maior abraça as quatro ilhas: o processo loja. As cercas de cada contexto continuam lá dentro.',
        key: 'Monolito modular: os mesmos limites do DDD, ainda num processo só.',
        f(o, t) { o.rows = { cat: CAT, est: EST, ent: ENT, pag: PAG }; o.fences.forEach(F => { F.on = true; }); JS(o, 'MONOLITO MODULAR · PASTAS', J.mod);
          K(o, ['PROCESSOS', '1'], ['CONTEXTOS', '4', 'acc'], ['DEPLOYS', '1']);
          if (t > 0.4) o.beams.push({ pts: fencePts(IX[0], IY, IX[3] + IW - IX[0], ID, 13), on: t > 0.4, th: 5 });
          if (t > 1.2) T(o, 'ent', 'processo loja:\n4 pastas com fronteira', 'acc', -92); } },
      { id: 'um-so', dur: 4.5, title: 'E se der errado: um modelo só para todos',
        story: 'Sem fronteiras, nasce um Produto único com os campos de todo mundo: nome, preço, fotos, descrição, quantidade, depósito, peso e dimensões. Pagamentos recebe fotos que não usa. Se Entregas quiser o peso em gramas, a mudança mexe na classe que Catálogo e Estoque também usam, e a palavra "produto" passa a querer dizer três coisas.',
        look: 'As cercas apagam e as quatro ilhas mostram o mesmo Produto 42, em vermelho, com 8 campos.',
        key: 'Sem contexto delimitado, toda mudança vira reunião com todos os times.',
        f(o, t) { const f = t > 0.6; o.rows = f ? { cat: ONE, est: ONE, ent: ONE, pag: ONE } : { cat: CAT, est: EST, ent: ENT, pag: PAG };
          o.fences.forEach(F => { F.on = !f; F.hide = f; }); if (f) ['cat', 'est', 'ent', 'pag'].forEach(nm => { o.on[nm] = 'bad'; });
          JS(o, 'UM MODELO PARA TODOS', J.one); K(o, ['CAMPOS NO MODELO', '8', 'bad'], ['QUEM USA', '4 contextos'], ['FRONTEIRAS', '0', 'bad']);
          if (t > 1.4) T(o, 'est', 'Produto único: 8 campos\nmudou um, afeta os 4', 'bad', 92); } },
    ],
    agregado: [
      { id: 'raiz', dur: 4, title: 'Pedido 1047: a raiz do agregado',
        story: 'O pedido da Lena é uma entidade: tem identidade, o id 1047, e continua sendo o mesmo pedido mesmo que algo nele mude. Ele é a raiz do agregado Pedido. Tudo o que pertence ao pedido fica dentro da mesma fronteira e só muda passando por ele.',
        look: 'A cerca do agregado acende em volta do Pedido 1047 e das peças que moram com ele; o Pedido, à esquerda, é a porta de entrada.',
        key: 'Agregado: um grupo de objetos que muda junto, com uma raiz como única porta.',
        f(o, t) { o.on.root = 1; o.fences[0].on = true; o.on.item = 2; o.on.end = 2; o.on.din = 2;
          JS(o, 'O AGREGADO PEDIDO', ['class Pedido {                 // raiz do agregado', '  id = 1047                     // identidade', '  cliente = "Lena"',
            '  itens = [ItemDoPedido(42, 1, 79.90)]', '  frete = Dinheiro(15.00, "BRL")', '  endereco = Endereco("Rua da Aurora, 100", …)', '}']);
          K(o, ['TOTAL', '94.90', 'acc'], ['ITENS + FRETE', '79.90 + 15.00'], ['INVARIANTE', 'ok']);
          if (t > 1.2) T(o, 'root', 'raiz: id 1047\na única porta de entrada'); } },
      { id: 'item', dur: 4, title: 'O item mora dentro do pedido',
        story: 'O gato entrou no pedido como um ItemDoPedido: produto 42, quantidade 1, 79.90. O item não vive sozinho e ninguém de fora guarda referência para ele. Quem quer adicionar ou mudar um item pede ao Pedido, e o Pedido atualiza o total no mesmo passo.',
        look: 'O Item do Pedido acende dentro da cerca, ao lado da raiz; a chamada adicionarItem chega pelo Pedido.',
        key: 'Dentro do agregado, só a raiz é acessada de fora.',
        f(o, t) { o.fences[0].on = true; o.on.root = t < 1.4 ? 1 : 2; if (t > 1.0) o.on.item = 1;
          JS(o, 'ADICIONAR UM ITEM', ['pedido.adicionarItem(produto: 42, qtd: 1)', '  → ItemDoPedido { produto: 42, qtd: 1,', '                  preco: 79.90 }', '  → total recalculado: 79.90 + 15.00 = 94.90 ✓', '', '// o item só existe dentro do Pedido 1047']);
          K(o, ['ITENS', '1', 'acc'], ['ITENS + FRETE', '79.90 + 15.00'], ['INVARIANTE', 'ok']);
          if (t > 0.3) T(o, 'item', 'pedido.adicionarItem(42, 1)\nentra pela raiz'); } },
      { id: 'vo', dur: 4.5, title: 'Endereço e Dinheiro: value objects',
        story: 'O endereço da Lena e o valor de 94.90 não têm identidade própria: valem pelo que contêm. Dois Dinheiro(94.90, "BRL") são o mesmo dinheiro. Ninguém edita a rua de um endereço: troca-se o endereço inteiro, e o pedido continua sendo o 1047.',
        look: 'Endereço e Dinheiro acendem dentro da cerca; no mostrador, a comparação dá true porque os valores são iguais.',
        key: 'Value object: igual se os valores são iguais; troca-se inteiro, não se edita.',
        f(o, t) { o.fences[0].on = true; o.on.root = 2; o.on.end = 1; o.on.din = 1;
          JS(o, 'VALUE OBJECTS', ['Dinheiro(94.90, "BRL") == Dinheiro(94.90, "BRL")', '  → true ✓  iguais porque os valores são iguais', '', 'Endereco { rua: "Rua da Aurora, 100",',
            '           cidade: "Recife", cep: "50050-000" }', '// mudou o endereço? troca o objeto inteiro;', '// o pedido continua sendo o 1047']);
          K(o, ['IDENTIDADE', 'só o Pedido', 'acc'], ['VALUE OBJECTS', '2'], ['INVARIANTE', 'ok']);
          if (t > 0.8) T(o, 'din', 'valem pelo valor:\nsem id próprio'); } },
      { id: 'regra', dur: 4, title: 'A regra que o agregado protege: 79.90 + 15.00 = 94.90',
        story: 'O agregado existe para garantir uma regra sempre verdadeira, a invariante: o total é a soma dos itens mais o frete. 79.90 do gato mais 15.00 de frete dão 94.90. Como tudo passa pela raiz, não há jeito de mudar um item e esquecer o total.',
        look: 'A raiz e o Dinheiro acendem; o mostrador fecha a conta 79.90 + 15.00 = 94.90 com um ✓.',
        key: 'Invariante: a regra que precisa valer depois de qualquer mudança no agregado.',
        f(o, t) { o.fences[0].on = true; o.on.root = 1; o.on.item = t > 0.6 ? 1 : 2; o.on.din = t > 1.2 ? 1 : 2; o.on.end = 2;
          JS(o, 'INVARIANTE', ['total = soma dos itens + frete', '      = 79.90 + 15.00', '      = 94.90 ✓', '', 'e mais uma regra do Pedido:', '"não dá para cancelar pedido já enviado"']);
          K(o, ['TOTAL', '94.90', 'acc'], ['ITENS + FRETE', '79.90 + 15.00'], ['INVARIANTE', 'ok ✓', 'acc']);
          if (t > 1.6) T(o, 'root', '79.90 + 15.00 = 94.90 ✓'); } },
      { id: 'barrado', dur: 5, title: 'Mexer no item por fora: barrado',
        story: 'Outro módulo da loja tenta pegar o item e trocar a quantidade direto: item.qtd = 2. Se passasse, os itens somariam 159.80 e o total continuaria 94.90, uma conta que não fecha. A fronteira do agregado barra a escrita; o caminho certo é pedir ao Pedido, que muda o item e o total juntos.',
        look: 'O raio vermelho sai do Outro Código e para na cerca do agregado, antes de chegar ao item.',
        key: 'De fora, só a raiz: quem pula a raiz quebra a invariante.',
        f(o, t) { o.fences[0].on = true; o.on.fora = t > 0.3 ? 'bad' : 0; o.on.root = 2;
          o.rows.fora = [['fora do agregado', 6.8, 'dim'], ['item.qtd = 2', 9.5, 'bad'], ['direto no item', 7.4, 'dim']];
          const cut = (cumLen(AG.fora2item).at(-1) - 24) / cumLen(AG.fora2item).at(-1);
          send(o, t, 0.4, 1.8, AG.fora2item, 'item.qtd = 2', 'bad', 0.3, cut);
          JS(o, 'ESCRITA POR FORA', ['// outro código, fora do agregado:', 'item = pedido.itens[0]', 'item.qtd = 2                 ✕ recusado', '// se passasse: itens 159.80 + frete 15.00',
            '//              ≠ total 94.90 (conta não fecha)', '// caminho certo: pedir ao Pedido, que muda', '// o item e recalcula o total juntos']);
          K(o, ['TOTAL', '94.90', 'acc'], ['ITENS + FRETE', '79.90 + 15.00'], ['INVARIANTE', t > 1.8 ? 'protegida' : 'ok', 'acc']);
          if (t > 2.1) T(o, 'din', '✕ barrado na fronteira\nsó pelo Pedido', 'bad', -30); } },
      { id: 'repo', dur: 5, title: 'Repositório: o domínio não fala SQL',
        story: 'Para guardar e buscar o pedido inteiro, o domínio usa um repositório: PedidoRepository.salvar(pedido) e buscar(1047). Quem escreve as linhas em pedidos e itens_pedido é o repositório; o Pedido nem sabe que existe SQL. buscar(1047) devolve o agregado completo, com itens e endereço.',
        look: 'A luz vai do Pedido até o Repositório com salvar(pedido) e volta com o Pedido 1047 inteiro.',
        key: 'Repositório: guarda e devolve agregados inteiros, e esconde o banco do domínio.',
        f(o, t) { o.fences[0].on = true; o.on.root = 1;
          if (send(o, t, 0.3, 1.5, AG.root2repo, 'salvar(pedido)', 'acc', 0.3)) o.on.repo = 1;
          send(o, t, 2.4, 3.6, rev(AG.root2repo), 'buscar(1047) → Pedido 1047', 'acc', 1.4);
          JS(o, 'REPOSITÓRIO', ['repo.salvar(pedido)', '  → INSERT INTO pedidos (id, cliente, total, …)', '  → INSERT INTO itens_pedido (pedido_id, produto, …)', '', 'repo.buscar(1047)',
            '  → um Pedido inteiro: itens, endereço, total', '// o Pedido não escreve SQL']);
          K(o, ['AGREGADO', 'Pedido 1047', 'acc'], ['TABELAS', 'pedidos, itens_pedido'], ['SQL NO DOMÍNIO', '0']);
          if (t > 1.6) T(o, 'repo', 'salvar · buscar', 'acc', -40); } },
      { id: 'anemico', dur: 5, title: 'E se der errado: o modelo anêmico',
        story: 'São 14:30 e o pedido 1047 já saiu com o rastreio LA123456789BR. No modelo anêmico o Pedido é só um saco de campos, e qualquer código escreve pedido.status = "cancelado". Ninguém confere a regra: o gato está a caminho de Recife e o sistema diz que o pedido foi cancelado.',
        look: 'O raio vermelho atravessa a cerca e chega à raiz; o status troca de enviado para cancelado, em vermelho.',
        key: 'Anêmico: as regras ficam espalhadas por quem chama, e alguém esquece.',
        f(o, t) { o.fences[0].on = true; o.on.fora = t > 0.3 ? 'bad' : 0;
          o.rows.fora = [['fora do agregado', 6.8, 'dim'], ['status =', 9.5, 'bad'], ['"cancelado"', 9.5, 'bad']];
          const done = send(o, t, 0.4, 1.8, AG.fora2root, 'pedido.status = "cancelado"', 'bad', 9);
          o.rows.root = done ? rootRows('cancelado ✕', 'bad') : rootRows('enviado'); o.on.root = done ? 'bad' : 2;
          JS(o, 'MODELO ANÊMICO', ['// o Pedido é só um saco de campos', 'pedido.status                  // "enviado" (14:30)', 'pedido.status = "cancelado"    ✕ ninguém impede', '',
            '// o gato está a caminho de Recife', '// e o pedido diz cancelado']);
          K(o, ['STATUS', done ? 'cancelado' : 'enviado', done ? 'bad' : ''], ['RASTREIO', 'LA123456789BR'], ['REGRA', done ? 'ignorada' : 'ok', done ? 'bad' : '']);
          if (t > 2) T(o, 'root', 'enviado → cancelado ✕\nninguém conferiu', 'bad', 20); } },
      { id: 'rico', dur: 5.5, title: 'O conserto: pedido.cancelar() recusa',
        story: 'No modelo rico, o status não é escrito de fora: quem quer cancelar chama pedido.cancelar(), e o próprio Pedido confere a regra. Como o status é enviado, ele recusa. A regra mora num lugar só, junto do dado que ela protege.',
        look: 'A chamada cancelar() chega à raiz, que responde em vermelho com a recusa; o status continua enviado.',
        key: 'Modelo rico: o objeto tem as regras e diz não quando a regra não deixa.',
        f(o, t) { o.fences[0].on = true; o.rows.root = rootRows('enviado', 'acc'); o.on.fora = t > 0.3 && t < 3.2 ? 1 : 2;
          o.rows.fora = [['fora do agregado', 6.8, 'dim'], ['pedido', 9.5, 'acc'], ['.cancelar()', 9.5, 'acc']];
          if (send(o, t, 0.4, 1.6, AG.fora2root, 'pedido.cancelar()', 'acc', 0.2)) o.on.root = 1;
          send(o, t, 2.0, 3.2, rev(AG.fora2root), 'recusado: já enviado', 'bad', 1.6);
          JS(o, 'MODELO RICO', ['cancelar() {', '  if (this.status == "enviado")', '    throw "não dá para cancelar pedido já enviado"', '  this.status = "cancelado"', '}', '',
            'pedido.cancelar()   ✕ recusado · status: enviado ✓']);
          K(o, ['STATUS', 'enviado', 'acc'], ['RASTREIO', 'LA123456789BR'], ['REGRA', 'protegida', 'acc']);
          if (t > 3.0) T(o, 'root', 'cancelar() recusado\nstatus: enviado ✓', 'acc', 20); } },
    ],
    eventos: [
      { id: 'donos', dur: 5, title: 'Cada tabela tem um dono',
        story: 'O banco loja foi repartido. Pedidos é dono de pedidos e itens_pedido, Pagamentos de pagamentos, Estoque de estoque e Entregas de remessas (e o Catálogo, fora da cena, de produtos). Ninguém lê a tabela do outro: quem precisa de um dado pergunta pela API do dono ou escuta o evento que ele publica.',
        look: 'Cada serviço mostra as suas tabelas. Entregas tenta um SELECT direto na tabela de Pedidos e o raio vermelho para no meio.',
        key: 'Banco por serviço: uma tabela, um dono, e o resto pergunta ou escuta.',
        f(o, t) { o.fences.forEach(F => { F.on = true; });
          o.on.ent = t > 0.3 && t < 3 ? 'bad' : 0; send(o, t, 0.4, 1.6, [[ICX[3], FRONT + 2, Z], [ICX[3], 274, Z], [ICX[0], 274, Z], [ICX[0], FRONT + 2, Z]], 'SELECT * FROM pedidos', 'bad', 9, 0.5);
          JS(o, 'DONOS DAS TABELAS', ['produtos      → catalogo', 'pedidos       → pedidos', 'itens_pedido  → pedidos', 'estoque       → estoque', 'pagamentos    → pagamentos', 'remessas      → entregas',
            '// SELECT na tabela do outro ✕', '// pergunta pela API ou escuta o evento']);
          K(o, ['TABELAS', '6'], ['DONOS', '5 serviços', 'acc'], ['LEITURA CRUZADA', 'proibida', 'bad']);
          if (t > 1.7) T(o, 'pag', 'tabela do outro ✕\npergunte ou escute', 'bad', 92); } },
      { id: 'criado', dur: 5, title: '14:02:10 · PedidoCriado (e-501)',
        story: 'A Lena fecha a compra. Pedidos grava o pedido 1047 nas suas tabelas e publica um evento de domínio, um fato no passado e no idioma do negócio: PedidoCriado, com itens, frete 15.00 e total 94.90. Pedidos não chama Pagamentos; Pagamentos escuta e começa a cobrar.',
        look: 'O cartão e-501 sai de Pedidos e para na linha do tempo; pelo barramento, o PedidoCriado chega a Pagamentos, que acende.',
        key: 'Evento de domínio: algo que já aconteceu, dito na língua do negócio.',
        f(o, t) { o.on.ped = t < 1.6 ? 1 : 2; o.fences[0].on = true; evK(o, 3, t > 1 ? 1 : 0, '14:02:10'); JS(o, 'EVENTO e-501 · 14:02:10', J.e501);
          pub(o, t, 0.2, 0, 0, 'e-501');
          if (send(o, t, 1.2, 2.6, busR(0, 1), 'PedidoCriado e-501', 'acc', 0.4)) { o.on.pag = 1; o.fences[1].on = true; o.rows.pag = pagRows('cobrando 94.90'); }
          if (t > 3) T(o, 'pag', 'escutou PedidoCriado:\ncobra 94.90'); } },
      { id: 'pago', dur: 5.5, title: '14:02:11 · PedidoPago (e-502)',
        story: 'O pagamento de 94.90 é aprovado. Pagamentos grava na sua tabela e publica PedidoPago. Dois serviços escutam: Estoque, que vai reservar o gato, e Entregas, que já pode preparar a remessa. Pagamentos não sabe quem escuta e nem precisa saber.',
        look: 'O cartão e-502 sai de Pagamentos; pelo barramento, dois pontos de luz levam o PedidoPago a Estoque e a Entregas.',
        key: 'Quem publica não conhece quem escuta: dá para pôr mais ouvintes sem mexer em Pagamentos.',
        f(o, t) { logT(o, 0, 'e-501'); o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc'); o.on.pag = t < 1.6 ? 1 : 2; o.fences[1].on = true;
          evK(o, 3, t > 1 ? 2 : 1, '14:02:11'); JS(o, 'EVENTO e-502 · 14:02:11', J.e502);
          pub(o, t, 0.2, 1, 1, 'e-502');
          if (send(o, t, 1.2, 2.4, busR(1, 2), 'PedidoPago e-502', 'acc', 0.4)) { o.on.est = 1; o.fences[2].on = true; }
          if (send(o, t, 1.2, 2.8, busR(1, 3), 'PedidoPago e-502', 'acc', 0.4)) { o.on.ent = 1; o.fences[3].on = true; o.rows.ent = entRows('preparando 1047'); }
          if (t > 3.2) T(o, 'est', 'dois ouvintes:\nEstoque e Entregas', 'acc', 92); } },
      { id: 'reservado', dur: 5, title: '14:02:11 · EstoqueReservado (e-503): 3 → 2',
        story: 'Estoque recebe o PedidoPago, separa um gato e baixa o SKU GATO-042 de 3 para 2 na sua tabela. Depois publica EstoqueReservado com o antes e o depois. Pedidos escuta e marca o 1047 como reservado.',
        look: 'O número do Estoque desce de 3 para 2; o cartão e-503 entra na linha do tempo e a luz leva o evento até Pedidos.',
        key: 'Cada serviço muda só a sua tabela e conta para os outros por evento.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc'); o.rows.ent = entRows('preparando 1047');
          const q = t > 0.8 ? 2 : 3; o.rows.est = estRows(q, t > 0.8 ? 'acc' : '', t > 0.8 ? 'antes 3 · depois 2' : ''); o.on.est = t < 2 ? 1 : 2; o.fences[2].on = true;
          evK(o, q, t > 1.4 ? 3 : 2, '14:02:11', t > 0.8 ? 'acc' : ''); JS(o, 'EVENTO e-503 · 14:02:11', J.e503);
          pub(o, t, 0.6, 2, 2, 'e-503');
          if (send(o, t, 1.6, 3.0, busR(2, 0), 'EstoqueReservado e-503', 'acc', 0.4)) { o.on.ped = 1; o.fences[0].on = true; o.rows.ped = pedRows('pago · reservado'); }
          if (t > 1) T(o, 'est', 'GATO-042: 3 → 2'); } },
      { id: 'enviado', dur: 5, title: '14:30:00 · PedidoEnviado (e-504)',
        story: 'Meia hora depois, Entregas despacha o volume de 0,4 kg para Recife com o rastreio LA123456789BR, grava em remessas e publica PedidoEnviado. Pedidos escuta e muda o status do 1047 para enviado. Quatro serviços, quatro tabelas, nenhuma leitura cruzada.',
        look: 'O cartão e-504 completa a linha do tempo; a luz volta pelo barramento até Pedidos, que mostra enviado.',
        key: 'A compra inteira é uma linha do tempo de eventos: e-501, e-502, e-503, e-504.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); logT(o, 2, 'e-503'); o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc'); o.rows.est = estRows(2, 'acc', 'antes 3 · depois 2');
          o.rows.ped = pedRows('pago · reservado'); o.rows.ent = entRows('LA123456789BR', 'acc'); o.on.ent = t < 1.6 ? 1 : 2; o.fences[3].on = true;
          evK(o, 2, t > 1 ? 4 : 3, '14:30:00', 'acc'); JS(o, 'EVENTO e-504 · 14:30:00', J.e504);
          pub(o, t, 0.2, 3, 3, 'e-504');
          if (send(o, t, 1.2, 2.8, busR(3, 0), 'PedidoEnviado e-504', 'acc', 0.4)) { o.on.ped = 1; o.fences[0].on = true; o.rows.ped = pedRows('enviado', 'acc'); }
          if (t > 3) T(o, 'ped', 'status: enviado'); } },
      { id: 'compensa', dur: 7, title: 'E se der errado: o estoque já estava em 0',
        story: 'Volte ao 14:02:11, mas agora com o GATO-042 em 0. O pagamento de 94.90 já foi aprovado e gravado em outro banco, então não existe mais um ROLLBACK que desfaça tudo. Estoque publica ReservaRecusada e Pagamentos precisa compensar: estorna os 94.90 e publica PagamentoEstornado. Coordenar esses passos tem nome, Saga, e fica para depois.',
        look: 'O Estoque mostra 0 em vermelho; a recusa volta pelo barramento até Pagamentos, que estorna. Os dois cartões novos entram em vermelho na linha do tempo.',
        key: 'Entre serviços, desfazer é fazer outra coisa: uma compensação.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.est = estRows(0, 'bad', 'nada para reservar'); o.on.est = 'bad'; o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc');
          o.fences.forEach(F => { F.on = true; }); K(o, ['ESTOQUE GATO-042', '0', 'bad'], ['PAGAMENTO', t > 3.4 ? 'estornado' : 'aprovado', t > 3.4 ? 'bad' : ''], ['ROLLBACK', 'não existe', 'bad']);
          send(o, t, 0.2, 1.2, busR(1, 2), 'PedidoPago e-502', 'acc', 0.2);
          if (t > 1.2) { JS(o, 'COMPENSAÇÃO', ['ReservaRecusada {', '  pedido_id: 1047, sku: "GATO-042",', '  motivo: "estoque 0"            ✕', '}',
            'PagamentoEstornado {', '  pedido_id: 1047, valor: 94.90', '}']); pub(o, t, 1.3, 2, 2, '', 'bad', 'ReservaRecusada', 'estoque 0'); }
          else JS(o, 'EVENTO e-502 · 14:02:11', J.e502);
          if (send(o, t, 2.0, 3.2, busR(2, 1), 'ReservaRecusada', 'bad', 0.4)) { o.on.pag = 1; o.rows.pag = pagRows('1047 · estornado', 'bad'); }
          if (t > 3.4) pub(o, t, 3.4, 1, 3, '', 'bad', 'PagamentoEstornado', 'devolve 94.90');
          if (t > 4.4) T(o, 'est', 'sem ROLLBACK entre bancos:\nPagamentos compensa', 'bad', 92); } },
    ],
    falha: [
      { id: 'cai', dur: 6, title: 'Entregas cai; a loja continua vendendo',
        story: 'Entregas está fora do ar. A Lena paga mesmo assim: Pagamentos publica PedidoPago, Estoque escuta e baixa o GATO-042 de 3 para 2. O evento que era para Entregas não se perde: fica esperando na fila dela até ela voltar.',
        look: 'Entregas apaga com um X. O PedidoPago chega ao Estoque e para na frente de Entregas, onde o cartão e-502 fica esperando na fila.',
        key: 'Com eventos numa fila, um serviço caído atrasa o seu trabalho sem derrubar o dos outros.',
        f(o, t) { logT(o, 0, 'e-501'); o.rows.ent = DOWN; o.on.ent = 'bad'; o.fences[3].tone = 'bad'; o.fences[3].on = true; o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc');
          JS(o, 'EVENTO e-502 · 14:02:11', J.e502); pub(o, t, 0.2, 1, 1, 'e-502');
          const got = send(o, t, 1.2, 2.4, busR(1, 2), 'PedidoPago e-502', 'acc', 0.4); if (got) { o.rows.est = estRows(2, 'acc', 'antes 3 · depois 2'); o.on.est = t < 3.4 ? 1 : 2; o.fences[2].on = true; }
          const qd = send(o, t, 1.2, 2.8, busR(1, 3), 'PedidoPago e-502', 'acc', 0.4, 0.84);
          if (qd) logT(o, 3, 'e-502', 'wait', 'na fila', 'espera Entregas voltar');
          if (got && t > 2.6) logT(o, 2, 'e-503');
          K(o, ['ESTOQUE GATO-042', got ? '2' : '3', got ? 'acc' : ''], ['NA FILA DE ENTREGAS', qd ? '1' : '0', qd ? 'acc' : ''], ['ENTREGAS', 'fora do ar', 'bad']);
          if (t > 3) T(o, 'ent', 'e-502 esperando\nna fila', 'acc', -20); } },
      { id: 'volta', dur: 5.5, title: 'Entregas volta e lê o que ficou na fila',
        story: 'Entregas volta ao ar e a primeira coisa que faz é ler a fila: lá está o PedidoPago e-502. Ela prepara a remessa, despacha o gato e publica PedidoEnviado com o rastreio LA123456789BR. Ninguém precisou reenviar nada à mão.',
        look: 'O cartão e-502 sobe da fila para dentro de Entregas, que acende; depois o e-504 entra na linha do tempo.',
        key: 'A fila guarda o fato até o ouvinte voltar.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); logT(o, 2, 'e-503'); o.rows.est = estRows(2, 'acc', 'antes 3 · depois 2'); o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc');
          o.on.ent = t > 0.3 ? 1 : 0; o.fences[3].on = true; o.rows.ent = t > 1.4 ? entRows('LA123456789BR', 'acc') : entRows('lendo a fila…');
          if (t < 1.4) { const f = ease(clamp((t - 0.3) / 1)), pts = [slotC(3), [ICX[3], BUSY, PL + 12], [ICX[3], FRONT - 20, PL + 44]];
            o.tiles.push({ label: 'e-502 · PedidoPago', sub: 'saindo da fila', c: alongPts(pts, cumLen(pts), f), st: 'on' }); }
          if (t > 1.6) pub(o, t, 1.8, 3, 3, 'e-504');
          JS(o, t > 1.8 ? 'EVENTO e-504 · 14:30:00' : 'LIDO DA FILA', t > 1.8 ? J.e504 : J.e502);
          K(o, ['ESTOQUE GATO-042', '2', 'acc'], ['NA FILA DE ENTREGAS', t > 1 ? '0' : '1'], ['ENTREGAS', 'no ar', 'acc']);
          if (t > 2.6) T(o, 'ent', 'leu o e-502 da fila\nenviou: e-504', 'acc', -20); } },
      { id: 'duplicado', dur: 6, title: 'E se der errado: o e-502 chega duas vezes',
        story: 'O Estoque processou o PedidoPago, mas a confirmação de recebimento se perdeu no caminho. A fila acha que ele não recebeu e entrega o e-502 de novo. Sem cuidado, o Estoque baixa outra vez: 3 → 2 → 1. Na prateleira há 2 gatos e o sistema diz 1.',
        look: 'Duas luzes com o mesmo e-502 chegam ao Estoque, uma depois da outra; o número desce para 2 e depois para 1, em vermelho.',
        key: 'Fila entrega pelo menos uma vez: o mesmo evento pode chegar repetido.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc'); o.fences[2].on = true;
          const a = send(o, t, 0.3, 1.3, busR(1, 2), 'PedidoPago e-502', 'acc', 0.2), b = send(o, t, 2.0, 3.0, busR(1, 2), 'e-502 de novo', 'bad', 0.6);
          const q = b ? 1 : a ? 2 : 3; o.rows.est = estRows(q, b ? 'bad' : a ? 'acc' : '', b ? '3 → 2 → 1 ✕' : a ? '3 → 2' : ''); o.on.est = b ? 'bad' : a ? 1 : 0;
          if (b) o.fences[2].tone = 'bad';
          JS(o, 'SEM IDEMPOTÊNCIA', ['ao receber PedidoPago:', '  estoque["GATO-042"] -= 1', '', `1ª entrega do e-502 → ${a ? '3 → 2' : '…'}`, `2ª entrega do e-502 → ${b ? '2 → 1  ✕' : '…'}`,
            '// na prateleira: 2 gatos · no sistema: ' + (b ? '1 ✕' : '…')]);
          K(o, ['ESTOQUE GATO-042', String(q), b ? 'bad' : ''], ['ENTREGAS DO e-502', b ? '2' : a ? '1' : '0', b ? 'bad' : ''], ['NA PRATELEIRA', '2']);
          if (t > 3.2) T(o, 'est', 'e-502 duas vezes:\n3 → 2 → 1 ✕', 'bad'); } },
      { id: 'idempotente', dur: 6, title: 'O conserto: guardar os evento_id já processados',
        story: 'O Estoque passa a anotar o evento_id de tudo o que já processou. A primeira entrega do e-502 baixa de 3 para 2 e anota e-502. Quando o mesmo e-502 chega de novo, ele confere a lista, vê que já fez e ignora. O estoque fica em 2, igual à prateleira. Esse cuidado se chama idempotência e volta num módulo futuro.',
        look: 'A segunda luz e-502 bate no Estoque e volta em vermelho como ignorada; o número fica em 2.',
        key: 'Idempotente: processar o mesmo evento duas vezes dá o mesmo resultado que uma.',
        f(o, t) { logT(o, 0, 'e-501'); logT(o, 1, 'e-502'); o.rows.pag = pagRows('1047 · 94.90 aprovado', 'acc'); o.fences[2].on = true;
          const a = send(o, t, 0.3, 1.3, busR(1, 2), 'PedidoPago e-502', 'acc', 0.2), b = send(o, t, 2.0, 3.0, busR(1, 2), 'e-502 de novo', 'bad', 0.1);
          if (b) send(o, t, 3.1, 4.1, busR(2, 1), 'já processado: ignora', 'bad', 1.2, 0.35);
          o.rows.est = estRows(a ? 2 : 3, a ? 'acc' : '', a ? 'processados: e-502' : 'processados: nenhum'); o.on.est = a ? 1 : 0;
          JS(o, 'COM IDEMPOTÊNCIA', ['ao receber PedidoPago:', '  if (processados.has(evento_id)) return  // ignora', '  estoque["GATO-042"] -= 1', '  processados.add(evento_id)', '',
            `1ª entrega do e-502 → ${a ? '3 → 2 ✓' : '…'}`, `2ª entrega do e-502 → ${b ? 'ignorada, fica 2 ✓' : '…'}`]);
          K(o, ['ESTOQUE GATO-042', a ? '2' : '3', a ? 'acc' : ''], ['ENTREGAS DO e-502', b ? '2' : a ? '1' : '0'], ['PROCESSADOS', a ? 'e-502' : '—', 'acc']);
          if (t > 3.4) T(o, 'est', 'e-502 já processado:\nfica 2 ✓', 'acc'); } },
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
    lbl('DADO REAL · ' + o.jh, L0, 9, 286);
    const n = o.json.length, fs = n > 6 ? 8.4 : 9.2, lh = n > 6 ? 10.8 : 12.4;
    o.json.slice(0, 8).forEach((l, i) => { x.fillStyle = l.includes('✕') ? BAD() : l.includes('✓') ? acc : l.trim().startsWith('//') ? INK() : C.inkHi;
      fitFont(x, u, l, fs, 288); x.fillText(l, u(L0), u(23 + i * lh)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Pedido, nomes, horários e números são o exemplo do módulo (a loja e o pedido 1047 da Lena), escritos como um sistema real escreveria.</li>';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const DATA = {
    contextos: () => `<table class="h3-sum"><tr><th>contexto</th><th>o gato é</th><th>campos</th></tr><tr><td>Catálogo</td><td>produto 42</td><td>nome, preco 79.90, fotos, descricao</td></tr>
      <tr><td>Estoque</td><td>SKU GATO-042</td><td>quantidade 3, deposito SP-1</td></tr><tr><td>Entregas</td><td>volume</td><td>peso 0.4 kg, 30×20×15 cm, destino Recife</td></tr>
      <tr><td>Pagamentos</td><td>(nada)</td><td>pedido_id 1047, valor 94.90</td></tr></table>
      <li><b>Linguagem ubíqua</b>: dentro de cada contexto, o código usa as mesmas palavras que o time usa na conversa (SKU no Estoque, volume em Entregas).</li>
      <li><b>Monolito modular</b>: as mesmas fronteiras viram pastas com interface pública dentro do processo loja, antes de virar serviços.</li>
      <li>Um modelo só para todos teria <b>8 campos</b> usados por 4 contextos, e cada mudança afetaria os 4.</li>${EX}`,
    agregado: () => `<li><b>Pedido 1047</b> (raiz, entidade): cliente Lena, itens, frete, endereço, total</li><li><b>ItemDoPedido</b>: produto 42, qtd 1, 79.90 (só muda pelo Pedido)</li>
      <li><b>Value objects</b>: Endereço { rua: "Rua da Aurora, 100", cidade: "Recife", cep: "50050-000" } e Dinheiro(94.90, "BRL")</li>
      <li><b>Invariantes</b>: total = soma dos itens + frete (79.90 + 15.00 = <b>94.90</b>) e "não dá para cancelar pedido já enviado"</li>
      <li><b>Repositório</b>: PedidoRepository.salvar(pedido) e buscar(1047); o SQL fica com ele</li>
      <table class="h3-sum"><tr><th>modelo</th><th>cancelar o 1047 enviado</th><th>resultado</th></tr><tr><td>anêmico</td><td>pedido.status = "cancelado"</td><td>aceito ✕</td></tr><tr class="on"><td>rico</td><td>pedido.cancelar()</td><td>recusado ✓</td></tr></table>${EX}`,
    eventos: () => `<table class="h3-sum"><tr><th>hora</th><th>evento</th><th>quem escuta</th></tr><tr><td>14:02:10</td><td>PedidoCriado e-501</td><td>pagamentos</td></tr>
      <tr><td>14:02:11</td><td>PedidoPago e-502</td><td>estoque, entregas</td></tr><tr><td>14:02:11</td><td>EstoqueReservado e-503</td><td>pedidos</td></tr><tr><td>14:30:00</td><td>PedidoEnviado e-504</td><td>pedidos</td></tr></table>
      <li>Donos: produtos → catalogo · pedidos + itens_pedido → pedidos · estoque → estoque · pagamentos → pagamentos · remessas → entregas</li>
      <li>GATO-042: <b>3 → 2</b> no EstoqueReservado (e-503)</li>
      <li>Estoque em 0: não há ROLLBACK entre bancos; Pagamentos compensa com o estorno de <b>94.90</b> (coordenar isso é uma Saga, assunto para depois)</li>
      <li>O 1047 passa por vários serviços e cada um escreve o seu log; um <b>trace_id=7f3a…</b> igual em todos liga os pedaços.</li>${EX}`,
    falha: () => `<table class="h3-sum"><tr><th>entrega do e-502</th><th>sem idempotência</th><th>com idempotência</th></tr><tr><td>1ª</td><td>3 → 2</td><td>3 → 2, anota e-502</td></tr>
      <tr class="on"><td>2ª (repetida)</td><td>2 → 1 ✕</td><td>ignorada, fica 2 ✓</td></tr></table>
      <li>Entregas fora do ar: o <b>PedidoPago e-502</b> espera na fila e é entregue quando ela volta; depois sai o PedidoEnviado e-504 (LA123456789BR).</li>
      <li>Por que repete: a fila entrega <b>pelo menos uma vez</b>; se a confirmação de recebimento se perde, ela entrega de novo.</li>
      <li>Conserto: o Estoque guarda os <b>evento_id</b> já processados e ignora o repetido (idempotência, aprofundada num módulo futuro).</li>${EX}`,
  };
  function countHtml() { const o = SP || spec(), k = o.k; if (!k.length) return '';
    const [l0, v0, t0] = k[0]; return `<b${t0 === 'bad' ? ' class="bad"' : ''}>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span><i>${k.slice(1).map(([l, v]) => `· ${esc(l.toLowerCase())}: ${esc(v)}`).join(' ')}</i>`; }
  const jsonHtml = o => `<b>Dado real · ${esc(o.jh.toLowerCase())}</b>${o.json.map(l => l.includes('✕') ? `<span class="bad">${esc(l)}</span>` : esc(l)).join('\n')}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="d3count">${countHtml()}</div>
      <div class="i3-sql" id="d3json">${jsonHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'dominio') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.k.map(([l, v]) => `${l.toLowerCase()} ${v}`).join(' · ')}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(380, 200, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(100, 200, 60), dist: 14 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–4 · arraste para girar' };
})() });
