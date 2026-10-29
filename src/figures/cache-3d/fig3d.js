// Figura 3D (iso-glow): cache. A Lena (Recife) abre a página do gato de pelúcia, produto 42, a mais vista da loja.
// Cena: ao fundo, o mostrador com hits / misses / hit rate, os ms gastos, o comando real e a resposta. Na frente, o APP,
// o REDIS e o BANCO (PostgreSQL), cada um com o que guarda escrito em cima; a FILA do write-behind e as 3 réplicas do
// cenário local entram quando o cenário pede. Mensagens correm nas vigas com o dado real (GET, SET … EX 60, SELECT, 89.90).
// Cenários (toggle e ?mode=aside|ttl|evict|through|behind|local; ?step=N abre no passo N; no evict, &pol=lru|lfu|fifo).
// Dados: a história canônica do módulo (docs/escrita/cache-brief.md): 40 ms banco, 1 ms Redis, 0,05 ms hashmap, TTL 60 s.
FIGS3D.push({ id: 'cache', name: 'Cache', mod: (() => {
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
  const fmt = v => Number.isInteger(+v.toFixed(2)) ? String(Math.round(v)) : v.toFixed(2).replace('.', ',');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const OLD = '89.90', NEW = '79.90', MS_DB = 40, MS_R = 1, MS_M = 0.05;
  const ACC = [42, 7, 42, 13, 99, 42];                       // sequência de acessos da evicção (3 vagas)
  const KEYS = [42, 7, 13, 99];
  const POL = ['lru', 'lfu', 'fifo'], POLNAME = { lru: 'LRU', lfu: 'LFU', fifo: 'FIFO' };
  const SC = ['aside', 'ttl', 'evict', 'through', 'behind', 'local'];
  const SCNAME = { aside: 'Aside', ttl: 'TTL', evict: 'Evicção', through: 'Through', behind: 'Behind', local: 'Local' };
  const SCFULL = { aside: 'Cache-aside', ttl: 'TTL e invalidação', evict: 'Evicção', through: 'Write-through', behind: 'Write-behind', local: 'Cache local × Redis' };
  const AULA = { aside: 'aula-4-hit-miss-e-hit-rate', ttl: 'aula-2-consistencia-e-ttl', evict: 'aula-3-eviccao-e-invalidacao',
    through: 'aula-6-cache-aside-write-through-write-behind-e-cdn', behind: 'aula-6-cache-aside-write-through-write-behind-e-cdn', local: 'aula-5-memoria-e-distribuido' };
  let clk = 0, sc = 'aside', pol = 'lru', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'), p = q.get('pol'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    if (POL.includes(p)) pol = p; const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-cache3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, BW = 176, BD = 130;
  plateWith(g0, 680, 400, [[14, 14], [666, 14], [14, 386], [666, 386]]);
  hazeAndShadow(g0, 340, 200, 8.2, 5.2);
  // mostrador ao fundo
  rbox(24, 12, PL, 520, 12, 148, 5, bodyMat, g0);
  const scr = faceCanvas('front', 28, 24, 152, 512, 135, 5, g0), SK = 512 / 424;   // o desenho do mostrador é feito em 424 × 112 e ampliado
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário
  function block(h, d, lab, sub) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, BW, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, BW - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, BW - 6, fh, 9, g);
    return { g, mat, top, fr, fh, h, d, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const B = {
    app: block(34, BD, 'APP', 'servidor da loja'), a2: block(34, BD, 'APP-2', 'hashmap · 0,05 ms'), a3: block(34, BD, 'APP-3', 'hashmap · 0,05 ms'),
    redis: block(30, BD, 'REDIS', 'memória · 1 ms'), db: block(44, BD, 'BANCO', 'PostgreSQL · 40 ms'), fila: block(20, 90, 'FILA', 'escritas pendentes'),
  };
  // chaves da evicção: cartões que entram nas 3 vagas do Redis e saem quando são expulsos
  const TW = 164, TD = 27, TH = 6;
  const TILE = {};
  KEYS.forEach(k => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, TW, TD, TH, 3, mat, g); const top = faceCanvas('top', 1, 1, TH, TW - 2, TD - 2, 8, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); TILE[k] = { g, mat, top, glow, key: '', pos: null, from: null, to: null, t0: 0 }; });
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
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
  const TAGS = [tag(12), tag(12)], MSGS = [tag(11), tag(11)], LENA = tag(11);

  // ── lugares e rotas (no chão, z = 10) ──
  const Z = 10, CX = [112, 340, 568];
  const LAY0 = { app: [24, 200], redis: [252, 200], db: [480, 200] };
  const LAY = { aside: LAY0, ttl: LAY0, evict: LAY0, through: LAY0, behind: { ...LAY0, fila: [480, 48] },
    local: { app: [24, 200], a2: [252, 200], a3: [480, 200], db: [480, 40], redis: [252, 40] } };
  const R = {
    lena: [[-70, 265, Z], [24, 265, Z]],
    a2r: [[200, 252, Z], [252, 252, Z]],
    a2d: [[112, 200, Z], [112, 158, Z], [568, 158, Z], [568, 200, Z]],
    r2d: [[428, 282, Z], [480, 282, Z]],
    r2f: [[400, 200, Z], [400, 178, Z], [520, 178, Z], [520, 138, Z]],
    f2d: [[620, 138, Z], [620, 200, Z]],
    lb: k => [[-70, 362, Z], [CX[k], 362, Z], [CX[k], 330, Z]],
    l2d: k => [[CX[k] + 30, 200, Z], [CX[k] + 30, 182, Z], [610, 182, Z], [610, 170, Z]],
    l2r: k => [[CX[k] - 30, 200, Z], [CX[k] - 30, 190, Z], [320, 190, Z], [320, 170, Z]],
  };
  const rev = pts => pts.slice().reverse();
  // balões: na faixa livre à frente de cada bloco (nunca em cima do texto dele)
  const ABOVE = { app: [112, 396, 16], a2: [340, 396, 16], a3: [568, 396, 16], redis: [340, 396, 16], db: [568, 396, 16], fila: [610, 182, 46],
    ldb: [640, 185, 60], lredis: [330, 185, 60] };

  // ── conteúdo dos blocos ──
  const redisRows = (preco, ttl, tone = '') => [['chave → valor', 6.8, 'dim'], ['produto:42', 11.5, 'acc'], ['nome: gato de pelúcia', 7.4], [`preco: ${preco}`, 11, tone], ['estoque: 3', 7.4],
    { bar: clamp(ttl / 60), lab: ttl > 0 ? `TTL ${Math.ceil(ttl)} s` : 'TTL 0 s · venceu', tone: ttl <= 5 ? 'bad' : '' }];
  const EMPTY = [['chave → valor', 6.8, 'dim'], ['vazio', 11, 'dim'], ['nenhuma chave guardada', 7.4, 'dim']];
  const DOWN = [['', 6.8], ['FORA DO AR', 12, 'bad'], ['conexão recusada', 7.6, 'dim'], ['tudo o que estava', 7.4, 'dim'], ['na memória sumiu', 7.4, 'dim']];
  const dbRows = (preco, tone = '') => [['tabela produtos', 6.8, 'dim'], ['id 42', 11.5, 'acc'], ['nome: gato de pelúcia', 7.4], [`preco: ${preco}`, 11, tone], ['estoque: 3', 7.4]];
  const appRows = (...l) => [['pedido de agora', 6.8, 'dim'], ...l];
  const hashRows = (preco, tone = '') => preco ? [['hashmap na memória', 6.8, 'dim'], ['produto:42', 11, 'acc'], [`→ preco ${preco}`, 10.5, tone], ['leitura: 0,05 ms', 7.4]]
    : [['hashmap na memória', 6.8, 'dim'], ['vazio', 11, 'dim'], ['ainda não leu nada', 7.4, 'dim']];

  // ── evicção: simula as políticas sobre a sequência de acessos ──
  function sim(p, n) {
    const slots = [null, null, null], meta = {}, log = [];
    for (let i = 0; i < n; i++) {
      const k = ACC[i], t = i + 1, at = slots.indexOf(k);
      if (at >= 0) { meta[k].last = t; meta[k].uses++; log.push({ k, hit: true, slot: at }); continue; }
      let free = slots.indexOf(null), victim = null;
      if (free < 0) { const by = p === 'lru' ? q => [meta[q].last] : p === 'fifo' ? q => [meta[q].in] : q => [meta[q].uses, meta[q].in];
        victim = slots.slice().sort((a, b) => { const A = by(a), Bq = by(b); return A[0] - Bq[0] || (A[1] || 0) - (Bq[1] || 0); })[0]; free = slots.indexOf(victim); }
      slots[free] = k; meta[k] = { in: t, last: t, uses: 1 }; log.push({ k, hit: false, victim, slot: free });
    }
    return { slots, meta, log };
  }
  const why = (p, m) => p === 'lru' ? `último uso mais antigo (t${m.last})` : p === 'fifo' ? `entrou primeiro (t${m.in})` : `menos usos (${m.uses}); empate: o mais antigo`;
  const metaTxt = (p, m) => p === 'lru' ? `último uso: t${m.last}` : p === 'fifo' ? `entrou: t${m.in}` : `usos: ${m.uses} · entrou t${m.in}`;
  const slotP = k => [252 + 6, 200 + 24 + k * 34, PL + 30];
  const FROMDB = [486, 236, PL + 44 + 6], OUT = [258, 372, 60];

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const L = LAY[sc];
    const o = { pos: { ...L }, on: {}, rows: {}, beams: [], tags: [], msgs: [], tiles: {},
      hits: 0, misses: 0, ms: 0, msLab: 'MS GASTOS ATÉ AGORA', avg: '', strip: [], cmd: [], res: [] };
    o.rows.app = appRows(['esperando', 9, 'dim'], ['a Lena abrir', 7.4, 'dim'], ['GET /produto/42', 7.4, 'dim']);
    o.rows.redis = EMPTY; o.rows.db = dbRows(OLD);
    if (sc === 'local') { o.rows.app = o.rows.a2 = o.rows.a3 = hashRows(null); o.hideRedis = true; }
    o.beams = sc === 'local' ? [0, 1, 2].flatMap(k => [{ pts: R.lb(k) }, { pts: R.l2d(k) }]) : [{ pts: R.lena }, { pts: R.a2r }, { pts: R.a2d }];
    if (sc === 'through' || sc === 'evict') o.beams.push({ pts: R.r2d });
    if (sc === 'behind') o.beams.push({ pts: R.r2f }, { pts: R.f2d });
    if (sc === 'behind') o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['vazia', 11, 'dim']];
    return o;
  }
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : ABOVE[at]), text, tone]);
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); o.msgs.push([pts, ease(f), text, tone]); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  const cnt = (o, h, m, ms) => { o.hits = h; o.misses = m; o.ms = ms; };
  const stripOf = s => s.split('').map(c => ({ k: c }));
  const GETCMD = ['GET produto:42'];
  const SETCMD = p => ['SET produto:42', `'{"nome":"gato de pelúcia",`, ` "preco":${p},"estoque":3}'`, 'EX 60'];
  const SELCMD = ['SELECT nome, preco, estoque', 'FROM produtos WHERE id = 42;'];
  const UPDCMD = ['UPDATE produtos SET preco = 79.90', 'WHERE id = 42;'];
  const ROWRES = p => [`gato de pelúcia | ${p} | 3`, '(1 linha · 40 ms)'];

  const STEPS = {
    aside: [
      { id: 'get', dur: 4.5, title: 'Miss: o Redis ainda não tem o produto:42',
        story: 'A Lena, em Recife, abre a página do gato de pelúcia, o produto 42 e o mais visto da loja. Antes de ir ao banco, o app pergunta ao Redis pela chave produto:42. É o primeiro pedido e o Redis responde (nil): não tem. Isso é um miss, e já custou 1 ms.',
        look: 'O pedido sai da Lena para o app e do app para o Redis, que volta vazio. O contador marca 1 miss.',
        key: 'Cache-aside: o app olha no cache primeiro; quem vai ao banco é o app.',
        f(o, t) { o.cmd = GETCMD; o.strip = stripOf(t > 2.4 ? 'M' : '');
          send(o, t, 0.2, 1.0, R.lena, 'GET /produto/42', 'hi'); if (t > 1.0) { o.on.app = 1; o.rows.app = appRows(['GET /produto/42', 9.5], ['1º: pergunta ao Redis', 7.4]); }
          send(o, t, 1.2, 2.0, R.a2r, 'GET produto:42'); if (t > 1.2 && t < 3.4) o.on.redis = 1;
          if (send(o, t, 2.4, 3.2, rev(R.a2r), '(nil) · miss', 'bad', 0.2)) { cnt(o, 0, 1, 1); o.res = ['(nil)', 'miss: a chave não existe']; }
          if (t > 2.4) cnt(o, 0, 1, 1); if (t > 3.4) T(o, 'redis', 'produto:42? (nil)\nmiss · 1 ms', 'bad'); } },
      { id: 'db', dur: 4.5, title: 'Vai ao banco: 40 ms',
        story: 'Com o miss, o app faz a consulta que faria se não houvesse cache: lê o produto 42 no PostgreSQL. A linha volta com nome, preço e estoque, e a ida ao banco leva 40 ms. O pedido já soma 41 ms: 1 do Redis que não tinha, 40 do banco.',
        look: 'A luz vai do app até o banco, que acende, e a linha do produto 42 volta para o app.',
        key: 'Um miss custa a ida ao cache mais a ida ao banco.',
        f(o, t) { o.cmd = SELCMD; cnt(o, 0, 1, 1); o.strip = stripOf('M'); o.on.app = 1; o.rows.app = appRows(['GET /produto/42', 9.5], ['2º: miss → banco', 7.4]);
          send(o, t, 0.3, 1.4, R.a2d, 'SELECT … WHERE id = 42', 'hi'); if (t > 1.2 && t < 3.2) o.on.db = 1;
          if (send(o, t, 1.8, 2.9, rev(R.a2d), '89.90 · 40 ms')) { cnt(o, 0, 1, 41); o.res = ROWRES(OLD); }
          if (t > 3.0) T(o, 'db', 'PostgreSQL: 40 ms\n1 + 40 = 41 ms'); } },
      { id: 'set', dur: 5, title: 'Guarda no Redis por 60 s e responde',
        story: 'Antes de responder, o app grava o que leu no Redis: SET produto:42 com o JSON do produto e EX 60, um TTL de 60 segundos. Depois devolve a página para a Lena. Esse primeiro pedido custou 41 ms; o SET é rapidinho e a conta do exemplo não inclui.',
        look: 'O JSON vai do app para o Redis, que passa a mostrar produto:42 com o TTL de 60 s, e a resposta volta para a Lena.',
        key: 'No miss, o app preenche o cache para o próximo pedido.',
        f(o, t) { o.cmd = SETCMD(OLD); cnt(o, 0, 1, 41); o.strip = stripOf('M'); o.on.app = 1; o.rows.app = appRows(['GET /produto/42', 9.5], ['3º: guarda e responde', 7.4]);
          if (send(o, t, 0.3, 1.3, R.a2r, 'SET produto:42 … EX 60')) { o.rows.redis = redisRows(OLD, 60); o.on.redis = 2; o.res = ['OK']; }
          if (t > 1.0 && t < 2.2) o.on.redis = 1;
          send(o, t, 2.4, 3.2, rev(R.lena), '200 · preço 89.90', 'acc');
          if (t > 1.6 && t < 3.6) T(o, 'redis', 'produto:42 guardado\nTTL 60 s'); if (t > 3.6) T(o, 'app', '1º pedido: 41 ms'); } },
      { id: 'hit', dur: 4.5, title: 'Pedido 2: hit em 1 ms',
        story: 'Segundos depois, outra pessoa abre a mesma página. O app pergunta ao Redis e agora a chave está lá, com o TTL ainda correndo. Hit: o produto volta em 1 ms e o banco nem fica sabendo.',
        look: 'A luz vai e volta só entre o app e o Redis; o banco fica apagado. O contador: 1 hit, 1 miss, 42 ms.',
        key: 'Hit: a resposta sai do cache, sem tocar no banco.',
        f(o, t) { o.cmd = GETCMD; cnt(o, 0, 1, 41); o.strip = stripOf('M'); o.rows.redis = redisRows(OLD, 56 - t * 0.5);
          send(o, t, 0.2, 0.9, R.lena, 'GET /produto/42', 'hi'); if (t > 0.9) { o.on.app = 1; o.rows.app = appRows(['GET /produto/42', 9.5], ['2º pedido', 7.4]); }
          send(o, t, 1.0, 1.7, R.a2r, 'GET produto:42'); if (t > 1.0 && t < 2.8) o.on.redis = 1;
          if (send(o, t, 2.0, 2.7, rev(R.a2r), '89.90 · hit · 1 ms', 'acc', 0.4)) { cnt(o, 1, 1, 42); o.strip = stripOf('MH'); o.res = [`{"nome":"gato de pelúcia",`, ` "preco":${OLD},"estoque":3}`]; }
          quiet(o, R.a2d); if (t > 3.0) T(o, 'redis', 'hit · 1 ms\n(o banco levaria 40)'); } },
      { id: 'rate', dur: 7.5, title: '10 pedidos: 8 hits, 2 misses',
        story: 'Os pedidos continuam. Do 3º ao 6º, todos hit. No 7º o TTL de 60 s já venceu, a chave sumiu e o app paga outra ida ao banco: miss. Do 8º ao 10º, hit de novo. Em 10 pedidos foram 8 hits e 2 misses, um hit rate de 80%.',
        look: 'A faixa de 10 pedidos no mostrador se completa: 8 hits, 2 misses. No 7º, a luz vai até o banco.',
        key: 'Hit rate = hits ÷ pedidos. Com 80%, o tempo médio cai de 40 ms para 9 ms.',
        f(o, t) { o.cmd = GETCMD; const seq = 'MHHHHHMHHH'; let n = 2;
          for (let k = 2; k < 10; k++) if (t > 0.4 + (k - 2) * 0.62) n = k + 1;
          const s = seq.slice(0, n), h = [...s].filter(c => c === 'H').length, m = n - h; cnt(o, h, m, h * MS_R + m * (MS_R + MS_DB)); o.strip = stripOf(s);
          const cur = n - 1, ph = t - (0.4 + (cur - 2) * 0.62), miss7 = cur === 6 && ph < 0.62;
          o.rows.redis = cur >= 6 ? redisRows(OLD, 60 - (cur - 6) * 4) : redisRows(OLD, 40 - (cur - 1) * 6);
          if (n > 2 && ph < 0.5) { o.on.app = 1; o.on.redis = 1; o.beams.push({ pts: R.a2r, on: true, dot: ph / 0.5 }); } else quiet(o, R.a2r);
          if (miss7) { o.on.db = 1; o.beams.push({ pts: R.a2d, on: true, dot: ph / 0.62 }); o.rows.redis = EMPTY; } else quiet(o, R.a2d);
          o.res = miss7 ? ['(nil) → banco · 41 ms'] : n > 2 ? [`${s.slice(-1) === 'H' ? 'hit' : 'miss'} · pedido ${n}`] : [];
          if (cur === 6 && ph < 1.4) T(o, 'db', '7º pedido: TTL venceu\nmiss → banco · 41 ms', 'bad');
          if (n === 10) { o.avg = 'média 9 ms (sem cache: 40)'; if (t > 6) T(o, 'redis', '8 hits ÷ 10 = 80%\nmédia 9 ms (sem cache: 40)'); } } },
      { id: 'down', dur: 7, title: 'E se der errado: o Redis cai',
        story: 'Agora o Redis caiu. No cache-aside, o app trata a falha como um miss e vai direto ao banco, então a loja continua no ar. Só que os mesmos 10 pedidos viram 10 idas ao PostgreSQL: 400 ms no total, 40 de média, e todo o tráfego da página mais vista cai em cima do banco.',
        look: 'O Redis apaga com um X; a luz agora vai do app direto ao banco, um pedido atrás do outro.',
        key: 'Cache-aside aguenta a queda do cache, mas o banco precisa aguentar a carga inteira.',
        f(o, t) { o.cmd = ['GET produto:42', '→ erro: conexão recusada', '(app segue direto para o banco)']; o.rows.redis = DOWN; o.on.redis = 'bad';
          let n = 0; for (let k = 0; k < 10; k++) if (t > 0.6 + k * 0.5) n = k + 1;
          cnt(o, 0, n, n * MS_DB); o.strip = stripOf('M'.repeat(n));
          const ph = t - (0.6 + (n - 1) * 0.5); if (n && ph < 0.45) { o.on.db = 1; o.on.app = 1; o.beams.push({ pts: R.a2d, on: true, dot: ph / 0.45 }); } else quiet(o, R.a2d);
          o.beams.push({ pts: R.a2r, tone: 'bad', on: true, cut: 0.5 }); o.res = n ? [`pedido ${n}: banco · 40 ms`] : [];
          if (t > 0.4 && t < 3.2) T(o, 'redis', 'Redis fora do ar\ncada pedido vai ao banco', 'bad');
          if (n === 10) { o.avg = 'média 40 ms · hit rate 0%'; T(o, 'db', '10 pedidos · 400 ms\no banco leva tudo', 'bad'); } } },
    ],
    ttl: [
      { id: 'warm', dur: 4.5, title: 'No Redis: 89.90, faltam 40 s',
        story: 'O produto:42 está no Redis desde o último miss, com o preço 89.90 e TTL de 60 s; faltam 40. A Lena abre a página e recebe 89.90 em 1 ms. Por enquanto, banco e cache dizem a mesma coisa.',
        look: 'Redis e banco mostram 89.90. O TTL do Redis desce segundo a segundo.',
        key: 'Enquanto ninguém muda o banco, o cache é uma cópia fiel.',
        f(o, t) { o.cmd = ['TTL produto:42']; o.res = ['(integer) 40']; o.rows.redis = redisRows(OLD, 40 - t * 0.5);
          send(o, t, 0.3, 1.0, R.a2r, 'GET produto:42'); if (t > 0.3 && t < 2.4) o.on.redis = 1;
          if (send(o, t, 1.3, 2.0, rev(R.a2r), '89.90 · hit · 1 ms', 'acc', 0.4)) { cnt(o, 1, 0, 1); o.strip = stripOf('H'); }
          if (t > 2.6) T(o, 'redis', 'cache: 89.90\nbanco: 89.90'); } },
      { id: 'change', dur: 4.5, title: 'O preço muda no banco: 79.90',
        story: 'A loja entra em promoção e alguém atualiza o banco: o gato de pelúcia passa a custar 79.90. O UPDATE vai direto ao PostgreSQL e ninguém avisa o Redis, que continua guardando 89.90 pelos 35 s que ainda faltam.',
        look: 'O preço no banco troca para 79.90; o do Redis fica em 89.90, agora em vermelho.',
        key: 'Cache é cópia: quando a fonte muda, a cópia não fica sabendo sozinha.',
        f(o, t) { o.cmd = UPDCMD; cnt(o, 1, 0, 1); o.strip = stripOf('H'); o.rows.redis = redisRows(OLD, 37 - t * 0.5); o.on.app = 1;
          o.rows.app = appRows(['promoção', 9.5], ['salva preço 79.90', 7.4]);
          if (send(o, t, 0.3, 1.4, R.a2d, 'UPDATE preco = 79.90', 'hi')) { o.rows.db = dbRows(NEW, 'acc'); o.res = ['UPDATE 1']; o.rows.redis = redisRows(OLD, 37 - t * 0.5, 'bad'); }
          if (t > 1.2 && t < 2.8) o.on.db = 1; quiet(o, R.a2r);
          if (t > 1.8) { T(o, 'redis', 'Redis: 89.90 ✕\nninguém avisou', 'bad'); T(o, 'db', 'banco: 79.90'); } } },
      { id: 'stale', dur: 4.5, title: 'A Lena vê o preço velho',
        story: 'A Lena recarrega a página. O app pergunta ao Redis, a chave está lá e volta em 1 ms: hit, com 89.90. Para o contador foi um ótimo pedido; para a Lena, um preço que já não vale. Vai continuar assim até o TTL vencer.',
        look: 'O hit volta do Redis com 89.90 enquanto o banco, apagado, diz 79.90.',
        key: 'Hit rate alto não garante resposta certa: o dado pode estar velho (stale).',
        f(o, t) { o.cmd = GETCMD; cnt(o, 1, 0, 1); o.strip = stripOf('H'); o.rows.db = dbRows(NEW, 'acc'); o.rows.redis = redisRows(OLD, 33 - t * 0.5, 'bad');
          send(o, t, 0.2, 0.9, R.lena, 'GET /produto/42', 'hi'); if (t > 0.9) o.on.app = 1;
          send(o, t, 1.0, 1.7, R.a2r, 'GET produto:42'); if (t > 1.0 && t < 2.8) o.on.redis = 1;
          if (send(o, t, 2.0, 2.7, rev(R.a2r), '89.90 · hit · 1 ms', 'bad', 0.4)) { cnt(o, 2, 0, 2); o.strip = stripOf('HH'); o.res = [`"preco":${OLD}  (velho)`]; }
          if (t > 3.0) T(o, 'app', 'a Lena vê 89.90\no banco diz 79.90', 'bad'); } },
      { id: 'expire', dur: 6.5, title: 'O TTL vence e o preço novo aparece',
        story: 'Os 30 s que faltavam passam, o TTL chega a zero e o Redis apaga produto:42 sozinho. O pedido seguinte é miss: o app lê o banco (40 ms), recebe 79.90 e grava de novo com EX 60. A partir daí todo mundo vê 79.90.',
        look: 'O TTL zera e a chave some do Redis; o miss vai ao banco e volta com 79.90.',
        key: 'O TTL é o prazo máximo que um dado velho pode durar no cache.',
        f(o, t) { o.rows.db = dbRows(NEW, 'acc'); cnt(o, 2, 0, 2); o.strip = stripOf('HH'); o.cmd = ['TTL produto:42']; o.res = [`(integer) ${Math.max(0, Math.ceil(30 - t * 20))}`];
          const ttl = 30 - t * 20; o.rows.redis = ttl > 0 ? redisRows(OLD, ttl, 'bad') : EMPTY; if (t < 1.6) o.on.redis = 1;
          if (t > 1.5 && t < 2.3) T(o, 'redis', 'TTL 0: chave apagada', 'acc');
          if (t > 1.8) { o.cmd = GETCMD; o.res = ['(nil)']; }
          send(o, t, 1.8, 2.4, R.a2r, 'GET produto:42'); if (send(o, t, 2.5, 3.0, rev(R.a2r), '(nil) · miss', 'bad', 0.1)) cnt(o, 2, 1, 3);
          if (t > 3.0) { o.cmd = SELCMD; o.on.app = 1; } send(o, t, 3.1, 3.8, R.a2d, 'SELECT … id = 42', 'hi'); if (t > 3.6 && t < 4.6) o.on.db = 1;
          if (send(o, t, 3.9, 4.6, rev(R.a2d), '79.90 · 40 ms', 'acc', 0.2)) { cnt(o, 2, 1, 43); o.strip = stripOf('HHM'); o.res = ROWRES(NEW); }
          if (t > 4.8) { o.cmd = SETCMD(NEW); o.res = ['OK']; }
          if (send(o, t, 4.8, 5.4, R.a2r, 'SET … 79.90 EX 60', 'acc', 0.2)) { o.rows.redis = redisRows(NEW, 60, 'acc'); o.on.redis = 2; }
          if (t > 5.6) T(o, 'redis', 'Redis: 79.90 ✓\nde novo igual ao banco'); } },
      { id: 'del', dur: 6, title: 'Sem esperar: apagar a chave junto com o UPDATE',
        story: 'Até 60 s de preço errado pode ser demais numa promoção. Volte ao instante da mudança: desta vez, logo depois do UPDATE no banco, o app manda DEL produto:42 para o Redis. O pedido seguinte é miss e já busca 79.90.',
        look: 'O UPDATE vai ao banco e, logo atrás, o DEL apaga a chave no Redis; o próximo pedido volta com 79.90.',
        key: 'Invalidar é apagar a chave quando a fonte muda, sem esperar o TTL.',
        f(o, t) { cnt(o, 1, 0, 1); o.strip = stripOf('H'); o.on.app = 1; o.rows.redis = redisRows(OLD, 37 - t * 0.5); o.cmd = UPDCMD;
          o.rows.app = appRows(['promoção', 9.5], ['UPDATE e depois DEL', 7.4]);
          if (send(o, t, 0.3, 1.2, R.a2d, 'UPDATE preco = 79.90', 'hi', 0.3)) { o.rows.db = dbRows(NEW, 'acc'); o.res = ['UPDATE 1']; }
          if (t > 1.4) { o.cmd = ['DEL produto:42']; o.res = ['(integer) 1']; }
          if (send(o, t, 1.4, 2.1, R.a2r, 'DEL produto:42', 'acc', 0.3)) o.rows.redis = EMPTY;
          if (t > 2.4) { o.cmd = GETCMD; o.res = ['(nil) → banco: 79.90']; }
          send(o, t, 2.6, 3.1, R.a2r, 'GET produto:42', 'hi', 0.1);
          if (send(o, t, 3.3, 4.1, rev(R.a2d), '79.90 · 40 ms', 'acc', 0.2)) { cnt(o, 1, 1, 42); o.strip = stripOf('HM'); }
          if (send(o, t, 4.3, 4.9, R.a2r, 'SET … 79.90 EX 60', 'acc', 0.2)) o.rows.redis = redisRows(NEW, 60, 'acc');
          if (t > 2.2 && t < 3.3) T(o, 'redis', 'DEL: chave apagada\nna hora do UPDATE');
          if (t > 5.0) T(o, 'app', 'preço velho: 0 s'); } },
      { id: 'lost', dur: 7, title: 'E se der errado: o DEL não chega',
        story: 'Invalidar depende de o DEL chegar. Se o app cair entre o UPDATE e o DEL, ou a rede falhar nessa hora, o banco fica com 79.90 e o Redis segue com 89.90, sem ninguém para apagar. Quem salva é o TTL: no pior caso, o preço velho dura os 60 s e some sozinho.',
        look: 'O DEL sai do app e se perde no meio do caminho; o Redis segue com 89.90 até o TTL zerar.',
        key: 'Use as duas coisas: invalidação para ser rápido, TTL como rede de segurança.',
        f(o, t) { cnt(o, 1, 0, 1); o.strip = stripOf('H'); o.on.app = 1; o.cmd = UPDCMD;
          if (send(o, t, 0.3, 1.2, R.a2d, 'UPDATE preco = 79.90', 'hi', 0.3)) { o.rows.db = dbRows(NEW, 'acc'); o.res = ['UPDATE 1']; }
          const ttl = t < 2.8 ? 60 : 60 - (t - 2.8) * 30; o.rows.redis = ttl > 0 ? redisRows(OLD, ttl, t > 1.2 ? 'bad' : '') : EMPTY;
          if (t > 1.5) { o.cmd = ['DEL produto:42']; o.res = ['(sem resposta: não chegou)']; }
          if (t > 1.5 && t < 2.8) { const f = clamp((t - 1.5) / 0.7) * 0.5; o.beams.push({ pts: R.a2r, on: true, tone: 'bad', cut: f }); o.msgs.push([R.a2r, f, 'DEL produto:42 ✕', 'bad']); }
          else if (t >= 2.8) o.beams.push({ pts: R.a2r, on: true, tone: 'bad', cut: 0.5 });
          if (t > 2.8 && ttl > 0) T(o, 'redis', `89.90 velho por mais ${Math.ceil(ttl)} s`, 'bad');
          if (ttl <= 0) { T(o, 'redis', 'pior caso: 60 s de 89.90\ndepois o TTL limpa', 'acc'); o.cmd = ['TTL produto:42']; o.res = ['(integer) -2  (a chave sumiu)']; } } },
    ],
    evict: [0, 1, 2, 3, 4, 5].map(i => ({ id: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'][i], dur: i === 4 ? 6.5 : i === 5 ? 6 : 4.5, ev: i })),
    through: [
      { id: 'same', dur: 4, title: 'Antes: 89.90 no Redis e no banco',
        story: 'No write-through, toda escrita passa pelo cache e segue para o banco na mesma operação. O produto:42 está nos dois com 89.90, e a promoção vai baixar o preço para 79.90.',
        look: 'Redis e banco lado a lado, os dois com 89.90.',
        key: 'Write-through: o cache fica no caminho da escrita, não só da leitura.',
        f(o, t) { o.rows.redis = redisRows(OLD, 60); o.cmd = ['(nenhum comando ainda)']; quiet(o, R.a2r, R.r2d); if (t > 0.8) { T(o, 'redis', 'cache: 89.90', 'hi'); T(o, 'db', 'banco: 89.90', 'hi'); } } },
      { id: 'write', dur: 6, title: 'Grava no Redis e no banco juntos',
        story: 'O app manda a mudança para a camada de cache. Ela grava 79.90 no Redis (1 ms) e, na mesma operação, faz o UPDATE no PostgreSQL (40 ms). Só quando o banco confirma é que a escrita volta como OK.',
        look: 'A luz vai do app ao Redis, que troca para 79.90, segue do Redis ao banco, que também troca, e o OK volta.',
        key: 'A escrita só termina quando os dois gravaram: 1 + 40 = 41 ms.',
        f(o, t) { o.msLab = 'MS DA ESCRITA'; o.on.app = 1; o.rows.app = appRows(['promoção', 9.5], ['salva preço 79.90', 7.4]); o.cmd = SETCMD(NEW); o.rows.redis = redisRows(OLD, 60);
          if (send(o, t, 0.3, 1.1, R.a2r, 'SET … 79.90', 'hi', 0.2)) { o.rows.redis = redisRows(NEW, 60, 'acc'); o.on.redis = 1; cnt(o, 0, 0, 1); o.res = ['OK (Redis)']; }
          if (t > 1.4) { o.cmd = UPDCMD; } if (send(o, t, 1.4, 2.4, R.r2d, 'UPDATE preco = 79.90', 'hi', 0.2)) { o.rows.db = dbRows(NEW, 'acc'); o.on.db = 1; cnt(o, 0, 0, 41); o.res = ['OK (Redis)', 'UPDATE 1 (banco)']; }
          send(o, t, 2.8, 3.8, rev([...R.a2r, ...R.r2d]), 'OK · 41 ms', 'acc');
          if (t > 4.0) T(o, 'app', 'escrita confirmada\n1 + 40 = 41 ms'); } },
      { id: 'read', dur: 4.5, title: 'Leitura: hit e já fresca',
        story: 'A Lena abre a página logo depois. Hit no Redis, 1 ms, e o preço já é 79.90: o cache nunca ficou para trás do banco. Quem pagou foi a escrita, que levou 41 ms em vez de 40.',
        look: 'O GET vai e volta entre o app e o Redis com 79.90; o banco fica apagado.',
        key: 'Leitura sempre fresca, porque o cache já recebeu a escrita.',
        f(o, t) { o.rows.redis = redisRows(NEW, 58, 'acc'); o.rows.db = dbRows(NEW, 'acc'); cnt(o, 0, 0, 41); o.cmd = GETCMD; quiet(o, R.r2d);
          send(o, t, 0.2, 0.9, R.lena, 'GET /produto/42', 'hi'); if (t > 0.9) o.on.app = 1;
          send(o, t, 1.0, 1.7, R.a2r, 'GET produto:42'); if (t > 1.0 && t < 2.8) o.on.redis = 1;
          if (send(o, t, 2.0, 2.7, rev(R.a2r), '79.90 · hit · 1 ms', 'acc', 0.4)) { cnt(o, 1, 0, 42); o.strip = stripOf('H'); o.res = [`"preco":${NEW}  (fresco)`]; }
          if (t > 3.0) T(o, 'redis', 'hit · 79.90 ✓\nigual ao banco'); } },
      { id: 'fail', dur: 6.5, title: 'E se der errado: o banco recusa',
        story: 'Volte ao momento da mudança para 79.90, agora com o PostgreSQL fora do ar. O Redis aceitaria, mas o UPDATE falha e a escrita inteira volta com erro; a camada de cache desfaz o SET para não guardar um preço que o banco não tem. Cache e banco seguem iguais, com 89.90, e a loja não consegue mudar preço até o banco voltar.',
        look: 'A luz chega ao Redis, segue para o banco e volta vermelha; o Redis volta a 89.90.',
        key: 'Write-through troca escrita mais lenta, e presa ao banco, por leitura sempre certa.',
        f(o, t) { o.msLab = 'MS DA ESCRITA'; o.on.app = 1; o.rows.app = appRows(['promoção', 9.5], ['salva preço 79.90', 7.4]); o.cmd = SETCMD(NEW); o.rows.redis = redisRows(OLD, 60);
          o.on.db = 'bad'; o.rows.db = [['tabela produtos', 6.8, 'dim'], ['FORA DO AR', 12, 'bad'], ['preco: 89.90', 11], ['(nada mudou)', 7.4, 'dim']];
          if (send(o, t, 0.3, 1.1, R.a2r, 'SET … 79.90', 'hi', 0.2)) { o.rows.redis = redisRows(NEW, 60, 'acc'); o.on.redis = 1; cnt(o, 0, 0, 1); }
          if (t > 1.4) o.cmd = UPDCMD; if (send(o, t, 1.4, 2.2, R.r2d, 'UPDATE preco = 79.90', 'hi', 0.1)) o.res = ['ERRO: o banco não respondeu'];
          if (send(o, t, 2.4, 3.2, rev(R.r2d), 'erro', 'bad', 0.2)) { o.rows.redis = redisRows(OLD, 60); o.on.redis = 0; o.cmd = ['desfaz o SET no Redis']; o.res = ['ERRO: escrita recusada']; }
          send(o, t, 3.4, 4.2, rev(R.a2r), 'erro · preço não mudou', 'bad');
          if (t > 5.0) { T(o, 'redis', 'Redis: 89.90\nbanco: 89.90 · iguais', 'hi'); T(o, 'app', 'escrita falhou\ntenta de novo depois', 'bad'); } } },
    ],
    behind: [
      { id: 'write', dur: 5.5, title: 'Grava só no Redis: 1 ms',
        story: 'No write-behind, a escrita para no cache. O app manda 79.90 para o Redis, recebe OK em 1 ms e a mudança entra numa fila para ir ao banco depois. Neste instante o Redis diz 79.90 e o PostgreSQL ainda diz 89.90.',
        look: 'O SET vai ao Redis, que fica com 79.90; uma entrada nova aparece na fila. O banco segue com 89.90.',
        key: 'Write-behind: confirma depois de gravar no cache; o banco recebe depois.',
        f(o, t) { o.on.app = 1; o.rows.app = appRows(['promoção', 9.5], ['salva preço 79.90', 7.4]); o.rows.redis = redisRows(OLD, 60); o.cmd = SETCMD(NEW); o.msLab = 'MS DA ESCRITA (PARA A LOJA)';
          if (send(o, t, 0.3, 1.1, R.a2r, 'SET … 79.90', 'hi', 0.2)) { o.rows.redis = redisRows(NEW, 60, 'acc'); o.on.redis = 1; cnt(o, 0, 0, 1); o.res = ['OK · 1 ms']; }
          if (send(o, t, 1.4, 2.3, R.r2f, 'enfileira UPDATE', 'acc', 0.3)) { o.on.fila = 1; o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['UPDATE produtos', 9, 'acc'], ['preco = 79.90 · id 42', 7.4]]; }
          quiet(o, R.f2d); send(o, t, 2.6, 3.3, rev(R.a2r), 'OK · 1 ms', 'acc');
          if (t > 3.6) { T(o, 'redis', 'Redis: 79.90'); T(o, 'db', 'banco: 89.90 (ainda)', 'hi'); } } },
      { id: 'read', dur: 4.5, title: 'A leitura já vê 79.90',
        story: 'A Lena abre a página e o Redis responde 79.90 em 1 ms. Por um tempo, a versão certa só existe no cache e na fila: o banco está atrasado de propósito.',
        look: 'O GET vai e volta entre o app e o Redis com 79.90; o banco, apagado, ainda mostra 89.90.',
        key: 'Enquanto a fila não descarrega, o cache é o único lugar com o dado novo.',
        f(o, t) { o.rows.redis = redisRows(NEW, 58, 'acc'); o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['UPDATE produtos', 9, 'acc'], ['preco = 79.90 · id 42', 7.4]]; o.on.fila = 2;
          o.msLab = 'MS GASTOS ATÉ AGORA'; cnt(o, 0, 0, 1); o.cmd = GETCMD; quiet(o, R.r2f, R.f2d);
          send(o, t, 0.2, 0.9, R.lena, 'GET /produto/42', 'hi'); if (t > 0.9) o.on.app = 1;
          send(o, t, 1.0, 1.7, R.a2r, 'GET produto:42'); if (t > 1.0 && t < 2.8) o.on.redis = 1;
          if (send(o, t, 2.0, 2.7, rev(R.a2r), '79.90 · hit · 1 ms', 'acc', 0.4)) { cnt(o, 1, 0, 2); o.strip = stripOf('H'); o.res = [`"preco":${NEW}`]; }
          if (t > 3.0) T(o, 'db', 'banco atrasado: 89.90', 'hi'); } },
      { id: 'flush', dur: 5, title: 'A fila descarrega no banco',
        story: 'Um processo em segundo plano tira a mudança da fila e faz o UPDATE no PostgreSQL. Se várias mudanças do mesmo produto se acumularem, ele pode juntar tudo numa escrita só. Agora os dois dizem 79.90 e a fila está vazia; os 40 ms do banco ficaram fora do caminho da Lena.',
        look: 'A entrada sai da fila e desce até o banco, que troca para 79.90.',
        key: 'O banco é atualizado depois, em lote, longe do pedido do usuário.',
        f(o, t) { o.rows.redis = redisRows(NEW, 56, 'acc'); cnt(o, 1, 0, 2); o.strip = stripOf('H'); o.cmd = UPDCMD; quiet(o, R.r2f);
          o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['UPDATE produtos', 9, 'acc'], ['preco = 79.90 · id 42', 7.4]]; o.on.fila = 1;
          if (send(o, t, 0.4, 1.6, R.f2d, 'UPDATE preco = 79.90', 'hi', 0.3)) { o.rows.db = dbRows(NEW, 'acc'); o.on.db = 1; o.on.fila = 0; o.res = ['UPDATE 1 (em segundo plano)'];
            o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['vazia', 11, 'dim'], ['tudo no banco ✓', 7.4]]; }
          if (t > 2.2) { T(o, 'db', 'banco: 79.90 ✓'); T(o, 'fila', 'fila vazia', 'hi'); } } },
      { id: 'crash', dur: 6, title: 'E se der errado: o Redis cai antes',
        story: 'Volte ao instante do SET. A mudança para 79.90 está no Redis e na fila, que mora na memória do Redis, e ele cai antes de descarregar. A fila vai junto: o UPDATE nunca chega ao banco.',
        look: 'O Redis apaga com um X e a entrada da fila some; o banco continua com 89.90.',
        key: 'No write-behind, o que está só na fila ainda pode se perder.',
        f(o, t) { o.on.app = 1; o.msLab = 'MS DA ESCRITA (PARA A LOJA)'; o.cmd = SETCMD(NEW); o.rows.redis = redisRows(OLD, 60);
          if (send(o, t, 0.3, 1.1, R.a2r, 'SET … 79.90', 'hi', 0.2)) { o.rows.redis = redisRows(NEW, 60, 'acc'); o.on.redis = 1; cnt(o, 0, 0, 1); o.res = ['OK · 1 ms']; }
          if (send(o, t, 1.2, 1.9, R.r2f, 'enfileira UPDATE', 'acc', 0.1)) { o.on.fila = 1; o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['UPDATE produtos', 9, 'acc'], ['preco = 79.90 · id 42', 7.4]]; }
          if (t > 2.6) { o.rows.redis = DOWN; o.on.redis = 'bad'; o.on.fila = 'bad'; o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['PERDIDA', 11, 'bad'], ['o UPDATE sumiu junto', 7.4, 'dim']];
            o.cmd = ['(o Redis caiu)']; o.res = ['a fila não descarregou']; o.beams.push({ pts: R.f2d, on: true, tone: 'bad', cut: 0.35 }); } else quiet(o, R.f2d);
          if (t > 3.0) { T(o, 'redis', 'Redis caiu\ncom a fila dentro', 'bad'); T(o, 'db', 'banco: 89.90\nnunca soube', 'hi'); } } },
      { id: 'lost', dur: 6.5, title: 'A mudança se perdeu',
        story: 'O Redis volta, vazio. O próximo pedido da Lena é miss, o app vai ao banco e recebe 89.90, que volta para o cache. Para a loja a promoção foi salva com OK; para o banco ela nunca aconteceu.',
        look: 'O Redis acende vazio, o miss vai ao banco e volta com 89.90.',
        key: 'Escrita rápida, mas a mudança só está segura quando chega ao banco.',
        f(o, t) { o.msLab = 'MS GASTOS ATÉ AGORA'; cnt(o, 0, 0, 1); o.rows.fila = [['fila (memória do Redis)', 6.8, 'dim'], ['vazia', 11, 'dim'], ['(a de antes sumiu)', 7.4, 'dim']]; o.cmd = GETCMD; quiet(o, R.r2f, R.f2d);
          send(o, t, 0.2, 0.9, R.lena, 'GET /produto/42', 'hi'); if (t > 0.9) o.on.app = 1;
          send(o, t, 1.0, 1.6, R.a2r, 'GET produto:42'); if (send(o, t, 1.7, 2.3, rev(R.a2r), '(nil) · miss', 'bad', 0.1)) { cnt(o, 0, 1, 2); o.res = ['(nil)']; }
          if (t > 2.4) o.cmd = SELCMD; send(o, t, 2.5, 3.2, R.a2d, 'SELECT … id = 42', 'hi', 0.1); if (t > 3.0 && t < 4.2) o.on.db = 1;
          if (send(o, t, 3.3, 4.0, rev(R.a2d), '89.90 · 40 ms', 'bad', 0.2)) { cnt(o, 0, 1, 42); o.strip = stripOf('M'); o.res = ROWRES(OLD); }
          if (send(o, t, 4.2, 4.8, R.a2r, 'SET … 89.90 EX 60', 'bad', 0.2)) o.rows.redis = redisRows(OLD, 60, 'bad');
          if (t > 5.0) T(o, 'app', 'a Lena vê 89.90\na promoção se perdeu', 'bad'); } },
    ],
    local: [
      { id: 'fill', dur: 7, title: '3 réplicas, 3 misses',
        story: 'A loja cresceu e roda em 3 réplicas do app, cada uma com um hashmap na própria memória servindo de cache. O balanceador espalha os pedidos: o 1º cai na APP-1, o 2º na APP-2, o 3º na APP-3. Cada hashmap começa vazio, então cada réplica paga o seu miss: 3 idas ao banco de 40 ms.',
        look: 'Um pedido entra em cada réplica, cada uma vai ao banco e guarda 89.90 no seu hashmap.',
        key: 'Cache local: cada réplica tem a sua cópia e enche a sua sozinha.',
        f(o, t) { o.cmd = ['hashmap.get("produto:42")', '→ undefined: vai ao banco']; let n = 0;
          [0, 1, 2].forEach(k => { const a = 0.3 + k * 2.1, nm = ['app', 'a2', 'a3'][k];
            send(o, t, a, a + 0.6, R.lb(k), `pedido ${k + 1}`, 'hi', 0.1);
            if (t > a + 0.6) { o.on[nm] = 1; } send(o, t, a + 0.7, a + 1.3, R.l2d(k), 'SELECT … id = 42', 'hi', 0.05);
            if (send(o, t, a + 1.35, a + 1.95, rev(R.l2d(k)), '89.90 · 40 ms', 'acc', 0.1)) { o.rows[nm] = hashRows(OLD); o.on[nm] = 2; n = k + 1; } });
          cnt(o, 0, n, n * (MS_M + MS_DB)); o.strip = stripOf('M'.repeat(n)); if (n) o.res = [`APP-${n}: guardou 89.90`];
          if (t > 6.6) T(o, 'ldb', '3 misses · 3 × 40,05 ms', 'hi'); } },
      { id: 'fast', dur: 5, title: 'Depois: hit em 0,05 ms',
        story: 'Com os 3 hashmaps cheios, os próximos 3 pedidos são hit, um em cada réplica, em 0,05 ms: 20 vezes mais rápido que o Redis, porque a leitura nem sai do processo.',
        look: 'Os 3 pedidos entram e voltam sem sair das réplicas; o banco fica apagado.',
        key: 'Cache local é o mais rápido que existe: memória do próprio processo.',
        f(o, t) { o.cmd = ['hashmap.get("produto:42")']; o.res = ['89.90 · 0,05 ms']; ['app', 'a2', 'a3'].forEach(nm => o.rows[nm] = hashRows(OLD)); let n = 0;
          [0, 1, 2].forEach(k => { const a = 0.3 + k * 1.1; if (send(o, t, a, a + 0.6, R.lb(k), `pedido ${k + 4} · hit`, 'acc', 0.2)) { n = k + 1; o.on[['app', 'a2', 'a3'][k]] = 1; } });
          cnt(o, n, 3, 3 * (MS_M + MS_DB) + n * MS_M); o.strip = stripOf('MMM' + 'H'.repeat(n)); quiet(o, R.l2d(0), R.l2d(1), R.l2d(2));
          if (t > 3.8) T(o, 'a2', 'hit · 0,05 ms\n(Redis: 1 ms)'); } },
      { id: 'change', dur: 5, title: 'O preço muda pela APP-2',
        story: 'A promoção é salva por um pedido que caiu na APP-2. Ela faz o UPDATE no banco (79.90) e atualiza o próprio hashmap. A APP-1 e a APP-3 não ficam sabendo: cada hashmap é uma ilha.',
        look: 'A APP-2 manda o UPDATE ao banco e troca o seu valor para 79.90; as outras duas seguem com 89.90.',
        key: 'Uma réplica só altera a própria memória; as outras continuam com a cópia antiga.',
        f(o, t) { o.cmd = UPDCMD; cnt(o, 3, 3, 3 * (MS_M + MS_DB) + 3 * MS_M); o.strip = stripOf('MMMHHH'); o.rows.app = hashRows(OLD); o.rows.a3 = hashRows(OLD); o.rows.a2 = hashRows(OLD); o.on.a2 = 1;
          if (send(o, t, 0.4, 1.3, R.l2d(1), 'UPDATE preco = 79.90', 'hi', 0.3)) { o.rows.db = dbRows(NEW, 'acc'); o.res = ['UPDATE 1']; }
          if (t > 1.6) { o.rows.a2 = hashRows(NEW, 'acc'); o.cmd = ['hashmap.set("produto:42", …79.90)']; o.res = ['só na APP-2']; }
          if (t > 2.2) { o.rows.app = hashRows(OLD, 'bad'); o.rows.a3 = hashRows(OLD, 'bad'); T(o, 'app', 'APP-1: 89.90', 'bad'); T(o, 'a3', 'APP-3: 89.90', 'bad'); } } },
      { id: 'split', dur: 6.5, title: 'E se der errado: cada réplica, um preço',
        story: 'A Lena recarrega a página 3 vezes e o balanceador a manda para uma réplica de cada vez: 89.90, 79.90, 89.90. É a mesma loja, no mesmo minuto, com dois preços. Só acerta quando o TTL de cada hashmap vencer, cada um na sua hora, ou quando a réplica reiniciar.',
        look: 'Os 3 pedidos voltam com preços diferentes: vermelho, laranja, vermelho.',
        key: 'Cache local com várias réplicas = várias cópias que discordam entre si.',
        f(o, t) { o.cmd = ['hashmap.get("produto:42")']; o.rows.db = dbRows(NEW, 'acc'); o.rows.app = hashRows(OLD, 'bad'); o.rows.a2 = hashRows(NEW, 'acc'); o.rows.a3 = hashRows(OLD, 'bad'); let n = 0;
          [0, 1, 2].forEach(k => { const a = 0.3 + k * 1.4, p = k === 1 ? NEW : OLD;
            send(o, t, a, a + 0.5, R.lb(k), 'GET /produto/42', 'hi', 0.05);
            if (send(o, t, a + 0.55, a + 1.15, rev(R.lb(k)), `${p} (APP-${k + 1})`, k === 1 ? 'acc' : 'bad', 0.5)) { n = k + 1; o.on[['app', 'a2', 'a3'][k]] = k === 1 ? 1 : 'bad'; } });
          cnt(o, 6 + n, 3, 3 * (MS_M + MS_DB) + (3 + n) * MS_M); o.strip = stripOf('MMMHHH' + 'H'.repeat(n)); o.res = ['89.90', '79.90', '89.90'].slice(0, n).map((p, i) => `APP-${i + 1}: ${p}`).slice(-2);
          if (t > 4.8) T(o, 'a2', 'mesma página, 2 preços\n89.90 · 79.90 · 89.90', 'bad'); } },
      { id: 'redis', dur: 7, title: 'A saída: um Redis para as 3',
        story: 'Com um Redis compartilhado, as 3 réplicas leem a mesma chave produto:42. A APP-2 grava o preço novo no banco e apaga a chave no Redis uma vez só, e as 3 passam a ver 79.90. Cada leitura custa 1 ms em vez de 0,05: é o preço de ter uma cópia só. E o Redis vira peça central: se ele cair, as 3 réplicas vão juntas ao banco.',
        look: 'Os hashmaps somem; o Redis aparece no meio e as 3 réplicas buscam nele o mesmo 79.90.',
        key: 'Cache distribuído: uma cópia para todas as réplicas, 1 ms por leitura.',
        f(o, t) { o.hideRedis = false; o.rows.db = dbRows(NEW, 'acc'); cnt(o, 0, 0, 0); o.msLab = 'MS GASTOS (SÓ ESTES 3 PEDIDOS)';
          ['app', 'a2', 'a3'].forEach(nm => o.rows[nm] = [['hashmap desligado', 6.8, 'dim'], ['usa o Redis', 10, 'hi'], ['leitura: 1 ms', 7.4]]);
          o.rows.redis = t < 1.0 ? EMPTY : redisRows(NEW, 60, 'acc'); o.cmd = ['DEL produto:42 (pela APP-2)', 'GET produto:42  ×3']; quiet(o, R.l2d(1));
          if (send(o, t, 0.3, 1.0, R.l2r(1), 'DEL → miss → SET 79.90', 'acc', 0.2)) o.on.redis = 2;
          let n = 0; [0, 1, 2].forEach(k => { const a = 1.6 + k * 1.2; if (send(o, t, a, a + 0.6, rev(R.l2r(k)), '79.90 · 1 ms', 'acc', 0.3)) { n = k + 1; o.on[['app', 'a2', 'a3'][k]] = 1; } });
          cnt(o, n, 0, n * MS_R); o.strip = stripOf('H'.repeat(n)); o.res = n ? [`as ${n} réplicas: 79.90`] : [];
          if (t > 5.4) T(o, 'lredis', 'uma cópia: 79.90 para as 3\nse cair, as 3 vão ao banco', 'acc'); } },
    ],
  };
  // evicção: o texto e a cena saem da simulação da política escolhida
  const EVT = [
    ['produto:42 entra (miss)', 'A loja guarda só 3 produtos no cache (3 vagas, para caber no desenho). O primeiro acesso do dia é ao produto:42: miss, o app lê o banco e grava a chave na primeira vaga. É o tempo 1 (t1).', 'O cartão produto:42 sai do banco e pousa na vaga 1 do Redis.', 'Cache tem tamanho fixo: cada chave ocupa uma vaga.'],
    ['produto:7 entra (miss)', 'Em t2 alguém abre o produto 7. Também não está no cache: miss, banco, e o produto:7 ocupa a segunda vaga. Sobra uma.', 'O cartão produto:7 pousa na vaga 2.', 'Enquanto houver vaga, um miss só acrescenta.'],
    ['produto:42 de novo: hit', 'Em t3 volta o gato de pelúcia. O produto:42 está na vaga 1: hit, 1 ms. Cada política anota isso de um jeito: o LRU muda o último uso para t3, o LFU conta 2 usos e o FIFO não muda nada, porque só olha quando a chave entrou.', 'O cartão produto:42 sobe e acende; a anotação dele muda conforme a política.', 'O que cada política anota a cada acesso decide quem sai depois.'],
    ['produto:13 ocupa a última vaga', 'Em t4 chega o produto 13: miss, e ele fica com a vaga 3. O cache está cheio: o próximo miss vai obrigar alguém a sair.', 'O produto:13 pousa na vaga 3; as três vagas estão ocupadas.', 'Cache cheio: daqui em diante, cada miss expulsa uma chave.'],
  ];
  function evictStep(i) {
    const before = sim(pol, i), after = sim(pol, i + 1), ev = after.log[i];
    let title, story, look, key;
    if (i < 4) [title, story, look, key] = EVT[i];
    else if (i === 4) { const v = ev.victim, m = before.meta[v];
      title = `produto:99: sai o produto:${v} (${POLNAME[pol]})`;
      story = `Em t5 chega o produto 99 e não há vaga. Quem decide é a política. Com ${POLNAME[pol]}, sai o produto:${v}: ${why(pol, m)}. ` +
        { lru: 'O LRU (least recently used) tira quem foi usado há mais tempo: o 42 foi visto em t3 e o 13 em t4.', lfu: 'O LFU (least frequently used) tira quem foi menos usado: o 42 tem 2 usos, o 7 e o 13 têm 1, e o 7 é mais antigo que o 13.', fifo: 'O FIFO (first in, first out) tira quem entrou primeiro, sem olhar quanto foi usado: o 42, que entrou em t1.' }[pol];
      look = `O cartão produto:${v} fica vermelho, sai do Redis e o produto:99 entra na vaga dele.`;
      key = 'Evicção: com o cache cheio, a política escolhe quem sai para a chave nova entrar.'; }
    else { const hit = ev.hit;
      title = hit ? `E se der errado: com ${POLNAME[pol]} deu certo, com FIFO não` : 'E se der errado: o FIFO tirou o mais visto';
      story = hit ? `Em t6 o gato de pelúcia é pedido de novo. Com ${POLNAME[pol]} o produto:42 ficou no cache: hit, 1 ms. Com FIFO ele teria saído em t5 por ser o mais antigo, mesmo sendo o mais visto, e este pedido seria miss (41 ms). Toque em FIFO para ver. ${pol === 'lru' ? 'O LRU também erra: uma rajada de produtos vistos uma vez só empurra o 42 para fora.' : 'O LFU também erra: demora a esquecer um produto que já foi popular e parou de ser.'}`
        : `Em t6 o gato de pelúcia, o produto mais visto da loja, é pedido de novo. O FIFO tirou ele em t5 só por ter entrado primeiro: miss, 41 ms, e para pô-lo de volta o FIFO expulsa o produto:${ev.victim}, que entrou em t2. Com LRU ou LFU, este pedido teria sido hit.`;
      look = hit ? 'O produto:42 continua na vaga e acende: hit.' : `O produto:42 volta do banco e o produto:${ev.victim} sai no lugar dele.`;
      key = 'A política certa é a que mantém no cache o que vai ser pedido de novo.'; }
    return { title, story, look, key, before, after, ev };
  }
  function evictF(o, t, i) {
    const E = evictStep(i), { before, after, ev } = E, k = ev.k;
    const hsofar = before.log.filter(l => l.hit).length, msofar = before.log.length - hsofar;
    cnt(o, hsofar, msofar, hsofar * MS_R + msofar * (MS_R + MS_DB));
    o.strip = before.log.map((l, j) => ({ k: l.hit ? 'H' : 'M', lab: String(ACC[j]) }));
    o.cmd = [`GET produto:${k}`, `t${i + 1} · política ${POLNAME[pol]}`];
    const tileOf = (st, kk, slot) => ({ p: slotP(slot), st, meta: metaTxt(pol, st === 'new' || (st === 'hit') ? after.meta[kk] : (before.meta[kk] || after.meta[kk])) });
    before.slots.forEach((kk, s) => { if (kk) o.tiles[kk] = tileOf('norm', kk, s); });
    send(o, t, 0.3, 1.0, R.a2r, `GET produto:${k}`, 'hi', 0.1); o.on.app = 1; o.rows.app = appRows([`GET /produto/${k}`, 9.5], [`acesso t${i + 1}`, 7.4]);
    const done = (h) => { cnt(o, hsofar + (h ? 1 : 0), msofar + (h ? 0 : 1), hsofar * MS_R + msofar * (MS_R + MS_DB) + (h ? MS_R : MS_R + MS_DB));
      o.strip = after.log.map((l, j) => ({ k: l.hit ? 'H' : 'M', lab: String(ACC[j]) })); };
    if (ev.hit) {
      if (t > 1.1) { o.tiles[k] = tileOf('hit', k, ev.slot); o.on.redis = 1; o.res = [`hit · 1 ms`]; done(true); T(o, 'redis', `hit · produto:${k}\n${metaTxt(pol, after.meta[k])}`); }
      return E;
    }
    if (t > 1.1) { o.res = ['(nil) · miss → banco']; T(o, 'db', `miss · produto:${k}\nbanco: 40 ms`, 'bad'); }
    let land = 1.5;
    if (ev.victim != null) { const v = ev.victim, vs = before.slots.indexOf(v); land = 3.0;
      if (t > 1.3) { o.tiles[v] = { p: slotP(vs), st: 'bad', meta: why(pol, before.meta[v]) }; o.on.redis = 1; }
      if (t > 1.3 && t < 2.6) T(o, 'redis', `cache cheio: sai produto:${v}\n${why(pol, before.meta[v])}`, 'bad');
      if (t > 2.4) o.tiles[v] = t < 3.6 ? { p: OUT, st: 'bad', meta: 'expulso' } : null;
      if (t > 2.4) o.res = [`evicção (${POLNAME[pol]}): produto:${v}`, `entra produto:${k}`]; }
    if (t > land) { o.tiles[k] = { p: t < land + 0.25 ? FROMDB : slotP(ev.slot), st: 'new', meta: metaTxt(pol, after.meta[k]) }; }
    if (t > land + 1.0) { done(false); o.tiles[k].st = 'norm'; }
    if (t > land + 0.2 && t < land + 1.0) o.beams.push({ pts: R.r2d, on: true }); else quiet(o, R.r2d);
    return E;
  }
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => { const s = L()[step]; if (sc !== 'evict') return s; const E = evictStep(s.ev); return { ...s, ...E, f: (o, t) => evictF(o, t, s.ev) }; };
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawBlock(Bk, rows, on, nm) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
      let y = 6; x.textAlign = 'left';   // nenhuma linha abaixo de ~10 unidades: texto fino some no tema claro
      if (nm === 'redis' && sc === 'evict') { x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText('3 vagas · chave → valor', u(6), u(9));
        [0, 1, 2].forEach(k => { x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(3), u(18 + k * 34), u(164), u(27)); x.setLineDash([]);
          x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText(`vaga ${k + 1} · livre`, u(10), u(31.5 + k * 34)); });
        rows = []; }
      for (const r of rows) {
        if (r.bar != null) { y += 3; const bw = W_ - 14; x.fillStyle = C.line; x.fillRect(u(6), u(y), u(bw), u(5)); x.fillStyle = r.tone === 'bad' ? BAD() : accC(); x.fillRect(u(6), u(y), u(bw * r.bar), u(5));
          y += 14; x.fillStyle = r.tone === 'bad' ? BAD() : C.inkHi; fitFont(x, u, r.lab, 10, W_ - 12); x.fillText(r.lab, u(6), u(y)); y += 10; continue; }
        const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.25, lh = s * 1.45; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      if (on === 'bad' && rows === DOWN) { x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(W_ - 40), u(10)); x.lineTo(u(W_ - 12), u(38)); x.moveTo(u(W_ - 12), u(10)); x.lineTo(u(W_ - 40), u(38)); x.stroke(); }
      cv.tex.needsUpdate = true; }
    const lab = nm === 'app' && sc === 'local' ? 'APP-1' : Bk.lab, sub = nm === 'app' && sc === 'local' ? 'hashmap · 0,05 ms' : Bk.sub;
    const fk = lab + sub + (on === 1) + (on === 'bad') + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5), small = Math.max(6.6, Math.min(10, Bk.fh - 5));
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; x.font = `700 ${u(big)}px ${MONO3}`; x.fillText(lab, u(3), u(mid));
      const lw = x.measureText(lab).width / P; x.fillStyle = INK(); x.font = `700 ${u(small)}px ${MONO3}`; x.fillText(sub, u(8 + lw), u(mid));
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  function drawTile(T_, kk, d) {
    const key = kk + JSON.stringify(d) + theme + accent.getHex(); if (T_.key === key) return; T_.key = key;
    const cv = T_.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', st = d.st, on = st === 'hit' || st === 'new', bad = st === 'bad';
    x.clearRect(0, 0, cv.c.width, cv.c.height);
    x.fillStyle = bad ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : (light ? '#eeeeed' : '#17181a'); x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = bad ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || bad ? 1.4 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = bad ? BAD() : on ? accC() : C.inkHi; x.font = `700 ${u(12.5)}px ${MONO3}`; x.fillText(`produto:${kk}`, u(4), u(8.4));
    x.textAlign = 'right'; x.font = `700 ${u(9)}px ${MONO3}`; x.fillText(st === 'hit' ? 'hit' : st === 'new' ? 'entrou' : bad ? 'sai' : '', u(158), u(8.4));
    x.textAlign = 'left'; x.fillStyle = bad ? BAD() : C.inkHi; fitFont(x, u, d.meta || '', 8.6, 154); x.fillText(d.meta || '', u(4), u(19.6));
    cv.tex.needsUpdate = true; T_.mat.emissiveIntensity = st === 'hit' ? 1 : st === 'new' ? 0.7 : 0;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.hits, o.misses, o.ms, o.msLab, o.avg, o.strip, o.cmd, o.res, sc, pol]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y) => { x.fillStyle = INK(); x.font = `700 ${u(7.8)}px ${MONO3}`; x.fillText(t, u(X), u(Y)); };
    const n = o.hits + o.misses, rate = n ? Math.round(100 * o.hits / n) + '%' : '—';
    lbl('HITS', 8, 9); lbl('MISSES', 64, 9); lbl('HIT RATE', 132, 9);
    x.font = `700 ${u(24)}px ${MONO3}`; x.fillStyle = acc; x.fillText(String(o.hits), u(8), u(29)); x.fillStyle = o.misses ? BAD() : C.inkHi; x.fillText(String(o.misses), u(64), u(29));
    x.fillStyle = C.inkHi; x.fillText(rate, u(132), u(29));
    lbl(o.msLab, 8, 50); x.fillStyle = acc; x.font = `700 ${u(18)}px ${MONO3}`; const mt = fmt(o.ms) + ' ms'; x.fillText(mt, u(8), u(66));
    if (o.avg) { const w = x.measureText(mt).width / P; x.fillStyle = C.inkHi; fitFont(x, u, o.avg, 8, 200 - w - 14); x.fillText(o.avg, u(14 + w), u(67)); }
    if (o.strip.length || sc === 'aside' || sc === 'evict') {
      const total = sc === 'evict' ? 6 : 10; lbl(sc === 'evict' ? 'ACESSOS (t1 → t6)' : 'PEDIDOS', 8, 84);
      for (let i = 0; i < Math.max(total, o.strip.length); i++) { const s = o.strip[i], X = 8 + i * (sc === 'evict' ? 32 : 19.5), w = sc === 'evict' ? 29 : 17;
        x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(X), u(91), u(w), u(15));
        if (!s) continue; x.fillStyle = s.k === 'H' ? acc : BAD(); x.fillRect(u(X + 0.8), u(91.8), u(w - 1.6), u(13.4));
        x.fillStyle = theme === 'light' ? '#ffffff' : '#141516'; x.textAlign = 'center'; x.font = `700 ${u(s.lab ? 7.4 : 8.5)}px ${MONO3}`;
        x.fillText(s.lab ? `${s.lab} ${s.k}` : s.k, u(X + w / 2), u(98.8)); x.textAlign = 'left'; } }
    const L0 = 232; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(106)); x.stroke();
    lbl('COMANDO · ' + SCNAME[sc].toUpperCase(), L0, 9);
    const cl = o.cmd.slice(0, 4), fs0 = cl.length > 2 ? 8.4 : 10; x.fillStyle = C.inkHi; cl.forEach((l, i) => { const s = fitFont(x, u, l, fs0, 186); x.fillText(l, u(L0), u(23 + i * (fs0 + 3.4))); });
    lbl('RESPOSTA', L0, 72);
    x.fillStyle = o.res.length ? acc : INK(); (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { fitFont(x, u, l, 8.6, 186); x.fillText(l, u(L0), u(85 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">40 ms (banco), 1 ms (Redis) e 0,05 ms (hashmap) são os números do exemplo do módulo, na ordem de grandeza de uma leitura real; o SET não entra na conta.</li>';
  const evictTable = () => { const rows = POL.map(p => { const s = sim(p, 6); return `<tr${p === pol ? ' class="on"' : ''}><td>${POLNAME[p]}</td><td>${s.log.map((l, j) => `${ACC[j]}${l.hit ? '✓' : '✕'}`).join(' ')}</td><td>${s.log[4].victim}</td><td>${s.log.filter(l => l.hit).length}/6</td></tr>`; }).join('');
    return `<table class="h3-sum"><tr><th>política</th><th>t1 … t6 (✓ hit · ✕ miss)</th><th>sai em t5</th><th>hits</th></tr>${rows}</table>`; };
  const DATA = {
    aside: () => `<table class="h3-sum"><tr><th>pedido</th><th>resultado</th><th>ms</th></tr><tr><td>1º</td><td>miss → banco → SET EX 60</td><td>1 + 40 = 41</td></tr><tr><td>2º a 6º</td><td>hit</td><td>1 cada</td></tr><tr><td>7º</td><td>miss (TTL venceu)</td><td>41</td></tr><tr><td>8º a 10º</td><td>hit</td><td>1 cada</td></tr></table>
      <li>Hit rate: <b>8 ÷ 10 = 80%</b></li><li>Tempo médio: 0,8 × 1 + 0,2 × (1 + 40) = <b>9 ms</b> (sem cache: 40 ms)</li><li>Total dos 10: 8 × 1 + 2 × 41 = <b>90 ms</b> · Redis fora: 10 × 40 = <b>400 ms</b></li>
      <li>Com o Redis fora, o app precisa de um timeout curto para não esperar o cache antes de ir ao banco.</li>${EX}`,
    ttl: () => `<li><b>SET produto:42 '{…}' EX 60</b>: guarda com TTL de 60 s · <b>TTL produto:42</b> → segundos que faltam (−2 = a chave não existe)</li><li>UPDATE no banco sem DEL: o Redis fica com 89.90 até o TTL vencer (<b>até 60 s</b> de preço velho)</li><li>UPDATE + <b>DEL produto:42</b>: o próximo pedido é miss e já lê 79.90</li><li>Se o DEL se perder, o TTL limita o estrago: <b>no máximo 60 s</b></li>${EX}`,
    evict: () => `${evictTable()}<li>Sequência: <b>42, 7, 42, 13, 99</b> (e 42 de novo em t6), cache com <b>3 vagas</b></li><li>LRU tira o de último uso mais antigo; LFU, o de menos usos (empate: o mais antigo); FIFO, o que entrou primeiro.</li><li>Redis: <b>maxmemory-policy</b> allkeys-lru ou allkeys-lfu (o LRU e o LFU do Redis são aproximados, por amostragem).</li>${EX}`,
    through: () => `<li>Escrita: SET no Redis (1 ms) + UPDATE no banco (40 ms) = <b>41 ms</b>, e só confirma depois dos dois</li><li>Leitura logo depois: <b>hit, 1 ms, 79.90</b></li><li>Banco fora do ar: a escrita falha inteira e o SET é desfeito; cache e banco continuam com <b>89.90</b></li>${EX}`,
    behind: () => `<li>Escrita para a loja: <b>1 ms</b> (só o Redis); o UPDATE de 40 ms vai depois, pela fila</li><li>Entre o SET e a descarga: Redis <b>79.90</b>, banco <b>89.90</b></li><li>Redis cai com a fila na memória: o UPDATE se perde, o próximo miss lê <b>89.90</b> do banco</li><li>Para reduzir a perda: fila persistente (AOF no Redis, um log ou uma fila externa) e descarga frequente.</li>${EX}`,
    local: () => `<table class="h3-sum"><tr><th>réplica</th><th>hashmap</th><th>depois da mudança pela APP-2</th></tr><tr><td>APP-1</td><td>89.90</td><td class="h3-dim">89.90 (velho)</td></tr><tr class="on"><td>APP-2</td><td>89.90</td><td>79.90</td></tr><tr><td>APP-3</td><td>89.90</td><td class="h3-dim">89.90 (velho)</td></tr></table>
      <li>Encher: 3 misses × (0,05 + 40) = <b>120,15 ms</b> · cada hit local: <b>0,05 ms</b></li><li>Com Redis compartilhado: 1 ms por leitura, <b>uma cópia</b> para as 3 réplicas</li>${EX}`,
  };
  function countHtml() { const o = SP || spec(), n = o.hits + o.misses;
    return `<b>${fmt(o.ms)} ms</b><span>${o.msLab.toLowerCase()}</span><i>${o.hits} ${o.hits === 1 ? 'hit' : 'hits'} / ${o.misses} ${o.misses === 1 ? 'miss' : 'misses'} / hit rate ${n ? Math.round(100 * o.hits / n) + '%' : '—'}</i>`; }
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}${sc === 'evict' ? ' · ' + POLNAME[pol] : ''}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      ${sc === 'evict' ? `<div class="o3-mode c3-pol" role="group" aria-label="Política de evicção">${POL.map(p => `<button data-pol="${p}" aria-pressed="${p === pol}" title="tecla P troca">${POLNAME[p]}</button>`).join('')}</div>` : ''}
      <h2>${s.title}</h2>
      <div class="i3-count" id="c3count">${countHtml()}</div>
      <div class="i3-sql"><b>Comando real</b>${o.cmd.join('\n').replace(/</g, '&lt;')}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cache') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.hits} hits / ${o.misses} misses · ${fmt(o.ms)} ms`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'cache' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-cache3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  const setPol = p => { pol = p; KEYS.forEach(k => { TILE[k].pos = null; }); return go(step); };
  const cyclePol = () => sc === 'evict' && setPol(POL[(POL.indexOf(pol) + 1) % POL.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'cache') return; const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const p = e.target.closest('[data-pol]'); if (p) setPol(p.dataset.pol); });
  backLink();

  // ── um quadro da cena ──
  const NAMES = ['app', 'a2', 'a3', 'redis', 'db', 'fila'];
  function scene3() {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], p = o.pos[nm], vis = !!p && !(nm === 'redis' && o.hideRedis);
      Bk.g.visible = vis; if (!vis) { Bk.pos = null; return; }
      const want = [p[0], p[1], PL];
      if (!Bk.pos) { Bk.pos = want.slice(); Bk.to = want; Bk.from = want; }
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      drawBlock(Bk, o.rows[nm] || [], o.on[nm] || 0, nm); });
    KEYS.forEach(kk => { const T_ = TILE[kk], d = sc === 'evict' ? o.tiles[kk] : null;
      if (!d) { T_.g.visible = false; T_.pos = null; T_.glow.material.uniforms.intensity.value = 0; return; }
      const want = [d.p[0], d.p[1], d.p[2] + (d.st === 'hit' ? 10 : 0)];
      if (!T_.pos) { T_.pos = want.slice(); T_.to = want; T_.from = want; }
      if (want.some((v, i) => v !== T_.to[i])) { T_.from = T_.pos.slice(); T_.to = want; T_.t0 = clk; }
      const f = ease(clamp((clk - T_.t0) / 0.9)), hop = Math.hypot(T_.to[0] - T_.from[0], T_.to[1] - T_.from[1]);
      T_.pos = lerp3(T_.from, T_.to, f); T_.pos[2] += Math.sin(f * Math.PI) * Math.min(60, hop * 0.3);
      T_.g.visible = true; T_.g.position.copy(W(...T_.pos)); drawTile(T_, kk, d);
      moveGlow(T_.glow, [T_.pos[0] + TW / 2, T_.pos[1] + TD / 2, T_.pos[2] + TH + 2], d.st === 'hit' || d.st === 'new' ? 0.9 : 0); });
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    LENA.set('Lena · Recife', 'dim').at(-56, sc === 'local' ? 380 : 286, 6);
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 36); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('c3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.querySelector('#info .i3-sql'), sh = '<b>Comando real</b>' + SP.cmd.join('\n').replace(/</g, '&lt;'); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-80, 670, 8, 405];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.9 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.78 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.47 : nar ? 0.49 : side + aW / 2, fy = POSTER ? 0.43 : nar ? 0.07 + aH * 0.6 : 0.52;
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
    if (e.key === 'p' || e.key === 'P') return cyclePol();
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr]), ...KEYS.map(k => TILE[k].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; }); KEYS.forEach(k => TILE[k].key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 200, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 200, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · política: P · arraste para girar' };
})() });
