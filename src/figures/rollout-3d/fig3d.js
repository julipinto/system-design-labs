// Figura 3D (iso-glow): o pedidos 2.4.0 → 2.5.0 saindo para produção por cinco caminhos (rollback, recreate, rolling,
// blue/green, canary). Na frente, os clientes e o lb-loja soltando o tráfego (5 pedidos/s) e o pg-pedidos; no meio,
// seis vagas de pod (2.4.0 grafite, 2.5.0 sódio); atrás, à esquerda, a peça do cenário (revisões, teste de fumaça,
// análise, os 10 pods do catalogo) e, à direita, o mostrador (contadores, a conta ou o YAML, o resultado).
// Cenários (botões e ?mode=rollback|recreate|rolling|bluegreen|canary; ?step=N abre no passo N).
// Dados: docs/escrita/deployment-brief.md (frete 0,00 em Recife, 1059 da Lena 64,00 → 49,00, 5 pedidos/s com 1 de Recife,
// pods de 30 s, recreate de 40 s, rolling de 90 s, R$ 54.000 · R$ 450 · R$ 2.250, 0,99^150 = 22%, 298 requisições).
FIGS3D.push({ id: 'rollout', name: 'Rollout', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const brl = n => 'R$ ' + thou(n);
  const pct = f => Math.round(f * 100) + '%';
  // o relógio da terça: segundos depois de 14:00:00
  const pad = n => String(n).padStart(2, '0');
  const hms = s => { const tot = Math.floor(50400 + s); return `${pad(Math.floor(tot / 3600))}:${pad(Math.floor(tot / 60) % 60)}:${pad(tot % 60)}`; };
  const secs = s => Math.floor(s) + ' s';
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['rollback', 'recreate', 'rolling', 'bluegreen', 'canary'];
  const SCNAME = { rollback: 'Rollback', recreate: 'Recreate', rolling: 'Rolling', bluegreen: 'Blue/<wbr>Green', canary: 'Canary' };
  const SCFULL = { rollback: 'Deploy e rollback', recreate: 'Recreate (Big Bang)', rolling: 'Rolling update', bluegreen: 'Blue/Green', canary: 'Canary' };
  const AULA = { rollback: 'aula-1-deploy-e-rollback', recreate: 'aula-2-big-bang-recreate', rolling: 'aula-3-rolling-updates', bluegreen: 'aula-4-blue-green', canary: 'aula-6-canary-releases' };
  let clk = 0, sc = 'canary', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-rollout3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  // botões de um passo: o pedido do teste de fumaça, a janela do blue, a análise do canary
  const ACTS = {
    teste: { label: 'Pedido do teste', opts: [['sem Recife', 'CEP de SP'], ['com Recife', 'CEP 50000–52999']] },
    janela: { label: 'scaleDownDelaySeconds', opts: [['30 s', 'padrão do Argo'], ['60 s', 'o lab'], ['10 min', 'exemplo']] },
    analise: { label: 'O que a análise mede', opts: [['só 5xx', 'o lab'], ['+ frete zero', 'a loja']] },
  };
  const actv = { teste: 0, janela: 1, analise: 0 };

  // ── geometria ──
  const PL = 7;
  plateWith(g0, 800, 460, [[14, 14], [786, 14], [14, 446], [786, 446]]);
  hazeAndShadow(g0, 400, 230, 9.2, 5.6);
  // o mostrador fica suspenso atrás, à direita, em dois pés
  const SX0 = 370, SZ = PL + 46, SW = 416, SH = SW * 143 / 416;
  rbox(SX0, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(SX0 + 20, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SX0 + SW - 30, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', SX0 + 4, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // as peças: cada cenário levanta só as suas (as outras descem para dentro da prancha)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, h < 16 ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  // seis vagas de pod no meio
  const PX = i => 30 + i * 126, PW = 110, PY = 175, PD = 95, PH = 30, PC = i => PX(i) + PW / 2;
  for (let i = 0; i < 6; i++) block('p' + i, PX(i), PY, PW, PD, PH);
  // treze vagas pequenas atrás: os 10 pods do catalogo e a folga do maxSurge (3)
  const CXc = j => 30 + j * 26, CW_ = 23, CY = 50, CD = 60, CCc = j => CXc(j) + CW_ / 2;
  for (let j = 0; j < 13; j++) block('c' + j, CXc(j), CY, CW_, CD, 16, 4);
  // atrás, à esquerda: a peça do cenário
  block('rev', 30, 40, 320, 90, 14); block('tst', 30, 40, 320, 90, 18); block('ana', 30, 40, 320, 90, 18);
  // na frente: clientes, lb-loja, pg-pedidos
  block('cli', 30, 335, 180, 85, 22); block('lb', 250, 335, 290, 85, 26); block('db', 580, 335, 190, 85, 18);
  const NAMES = Object.keys(B);
  creases(first);

  // cabos grossos (vigas) e pontos (o tráfego e a ficha 1059)
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 72 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 30 }, () => { const mat = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false }); const g = new THREE.Group(); g0.add(g);
    const m = new THREE.Mesh(BOX, mat); m.scale.setScalar(11 * TS); g.add(m); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, m, mat, glow }; });
  const OLD = () => theme === 'light' ? 0x4b5054 : 0xa3a8ac;
  let nDot = 0;
  function dot(p, tone, big) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p)); D.m.scale.setScalar((big ? 16 : 11) * TS);
    if (tone === 'bad') D.mat.color.set(BAD()); else if (tone === 'old') D.mat.color.set(OLD()); else D.mat.color.copy(accent);
    moveGlow(D.glow, p, tone === 'old' ? 0 : tone === 'bad' ? 0.5 : big ? 1.1 : 0.7); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on || b.tone ? 5.5 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
  }

  // ── rótulos que olham para a câmera ──
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
      tex.needsUpdate = true; const k = (innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1) * 1.3; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = Array.from({ length: 8 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── cabos ──
  const LBX = 395, LANEY = 305, LANEZ = 48;
  const laneX = k => LBX + (k - 2.5) * 22;
  const podLane = i => [[laneX(i), 335, 26], [laneX(i), LANEY, LANEZ], [PC(i), LANEY, LANEZ], [PC(i), PY + PD, 22]];
  const catLane = j => [[LBX, 335, 26], [LBX, 150, LANEZ], [CCc(j), 150, LANEZ], [CCc(j), CY + CD, 12]];
  const refLane = k => [[laneX(k), 335, 26], [laneX(k), LANEY - 4, LANEZ + 2], [laneX(k), 335, 26]];
  const CLI = [[210, 377, 16], [250, 377, 16]];
  // a ficha 1059: dos clientes ao pod e do pod ao pg-pedidos
  const lenaIn = i => [[120, 377, 34], [LBX, 377, 40], [LBX, LANEY + 2, LANEZ + 10], [PC(i), LANEY + 2, LANEZ + 10], [PC(i), PY + PD, 26]];
  const lenaOut = i => [[PC(i) + 20, PY + PD, 12], [PC(i) + 20, 292, 12], [675, 292, 12], [675, 335, 12]];
  // da peça de trás (teste, análise) até a traseira dos pods
  const backLane = i => [[190, 130, 14], [190, 152, 30], [PC(i), 152, 30], [PC(i), PY, 18]];
  const rev = pts => pts.slice().reverse();
  function pk(o, pts, f, label, tone = '', big) {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone, big]);
    if (label) o.tags.push([p[0], p[1], p[2] + 20, label, tone === 'old' ? 'hi' : tone || 'acc']);
  }
  const go_ = (t, a, b) => lin(t, a, b, 0, 1);
  function send(o, pts, t, a, b, label, tone = '') { const f = go_(t, a, b); if (f > 0 && f < 1) o.beams.push({ pts, on: true, tone }); pk(o, pts, f, label, tone); return f >= 1; }

  // ── conteúdo padrão das peças ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  // um pod: v = 'old' (2.4.0) ou 'new' (2.5.0); st = ok, start (com bar 0..1), stop, bad
  const P = (o, i, v, st = 'ok', x = {}) => { o.pods[i] = { v, st, ...x }; };
  const C = (o, j, v, st = 'ok', x = {}) => { o.cat[j] = { v, st, ...x }; };
  const db = (o, ...rows) => { o.rows.db = act('pg-pedidos', 'BANCO', ...rows); };
  const lb = (o, ...rows) => { o.rows.lb = act('lb-loja', '', ...rows); };
  function base() {
    const o = { show: { cli: 1, lb: 1, db: 1 }, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [], pods: [], cat: [], lanes: null, lena: null };
    o.rows.cli = act('clientes', '', ['5 pedidos/s', 'acc'], ['SP 55 · Rio 25 · Recife 20', 'dim']);
    lb(o, ['round robin', 'dim'], ['5 pedidos/s', 'dim']);
    db(o, ['tabela pedidos', 'dim'], ['frete 0,00: 0 linhas', 'dim']);
    if (sc === 'rollback') { o.show.rev = 1; o.rows.rev = act('revisões', 'LIMITE: 10', ['2.4.0 · atual', 'acc'], ['—', 'dim']); }
    if (sc === 'bluegreen') { o.show.tst = 1; o.rows.tst = act('teste de fumaça', 'SEM CLIENTE', ['pela prévia (green)', 'dim'], ['—', 'dim']); }
    if (sc === 'canary') { o.show.ana = 1; o.rows.ana = act('análise', 'A CADA DEGRAU', ['espera o degrau', 'dim'], ['—', 'dim']); }
    o.beams.push({ pts: CLI });
    return o;
  }
  // fatia do tráfego: lista [alvo, peso]; alvo 'pN' (pod), 'cN' (catalogo) ou 'x' (503, volta do lb-loja)
  const lanes = (o, ...w) => { o.lanes = w.filter(([, f]) => f > 0); };
  const even = (o, ...ids) => lanes(o, ...ids.map(i => ['p' + i, 1 / ids.length]));
  const lena = (o, i, t0, ok, t) => { o.lena = { i, t0, ok }; };
  const LENA = '1059 · Lena · Recife';

  // ── o que se vê em cada passo ──
  const STEPS = {
    rollback: [
      { id: 'cenario', dur: 6, title: 'Terça, 14:00: a 2.4.0 atende 5 pedidos/s', yk: 'O CENÁRIO',
        code: ['pedidos 2.4.0 · 3 pods · 30 pedidos/s cada', '5 pedidos/s: SP 55% · Rio 25% · Recife 20%', 'Recife: 1 pedido/s', '1059 · Lena: camiseta preta 49,00', '         + frete Recife 15,00 = 64,00'],
        story: 'Terça-feira, <b>14:00</b>, um dia comum: <b>5 pedidos/s</b> chegam ao <code>lb-loja</code>, que reparte entre os <b>3 pods</b> do <code>pedidos</code> <b>2.4.0</b>. Um em cada cinco pedidos é de Recife: <b>1 por segundo</b>. A Lena (<code>lena-77</code>) cria o pedido <b>1059</b>: 1 camiseta preta, 49,00, mais 15,00 de frete para Recife, <b>64,00</b>.',
        look: 'Os pontos saem do lb-loja e se dividem entre os três pods cinza (2.4.0). A ficha 1059 da Lena cai num deles e grava 64,00 no pg-pedidos.',
        key: 'Até aqui, a versão no ar é uma só, e ela calcula o frete de Recife.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2); lena(o, 1, 0.6, true);
          const done = t > 4.4; db(o, ['1059 · ' + (done ? '64,00' : '…'), done ? 'acc' : 'dim'], ['frete 0,00: 0 linhas', 'dim']);
          o.cnt = [['PEDIDOS/S', '5'], ['NA 2.5.0', '0%', 'dim'], ['1059', done ? '64,00' : '…', 'dim']];
          o.res = done ? [['1059 gravado: 64,00', 'acc']] : []; } },
      { id: 'publica', dur: 7, title: 'Deploy: a imagem pedidos:2.5.0 vai para produção', yk: 'CI/CD E AS REVISÕES',
        code: ['commit → imagem pedidos:2.5.0', '       → testes → produção', 'kubectl rollout history deployment/pedidos', '  anterior  2.4.0', '  atual     2.5.0', 'revisionHistoryLimit: 10 (padrão)'],
        story: 'Um commit vira a imagem <code>pedidos:2.5.0</code>, passa nos testes e vai para produção. A 2.5.0 grava o frete numa coluna própria e o calcula por <b>faixa de CEP</b>. Publicar (<i>deploy</i>) é pôr a versão no ar; liberar (<i>release</i>) é o cliente passar a usá-la. O Kubernetes guarda a revisão anterior: <code>revisionHistoryLimit</code> é <b>10</b> por padrão, e <b>0</b> apaga a chance de voltar.',
        look: 'Na prateleira de revisões, atrás, a 2.5.0 entra como atual e a 2.4.0 fica guardada. Os pods trocam de cinza para sódio, um por vez.',
        key: 'Só volta quem guardou a revisão anterior.',
        f(o, t) { let n = 0; [0, 1, 2].forEach(i => { const nw = t > 1.4 + i * 1.3; if (nw) n++; P(o, i, nw ? 'new' : 'old'); }); even(o, 0, 1, 2);
          o.rows.rev = act('revisões', 'LIMITE: 10', ['2.5.0 · atual', 'acc'], ['2.4.0 · anterior (guardada)', 'dim']); o.on.rev = 1;
          o.cnt = [['NA 2.5.0', pct(n / 3)], ['REVISÕES', '2 de 10', 'dim'], ['ROLLOUT', n === 3 ? 'completo' : 'em curso', 'dim']];
          o.res = n === 3 ? [['2.5.0 no ar; 2.4.0 guardada', 'acc']] : []; } },
      { id: 'defeito', dur: 7, title: 'O 1059 da Lena sai com frete 0,00, e tudo parece saudável', yk: 'O QUE A 2.5.0 RESPONDE',
        code: ['POST /pedidos → 201 Created', '1059: 49,00 + frete 0,00 = 49,00', 'CEP 50000–52999 fora da tabela nova', '/healthcheck → 200', 'erros: 0% · latência: a mesma'],
        story: 'A tabela nova de frete <b>não tem a faixa de CEP de Recife</b> (50000–52999) e devolve <code>frete = 0,00</code>. O 1059 da Lena sai por <b>49,00</b> em vez de 64,00. A 2.5.0 responde <code>201</code>, o <code>/healthcheck</code> dá <code>200</code>, a latência é a mesma e a taxa de erros é <b>0%</b>. Para cada pedido de Recife a loja perde <b>15,00</b>, um por segundo.',
        look: 'A ficha 1059 entra num pod sódio e chega vermelha ao pg-pedidos: 49,00. O contador de frete zero sobe um por segundo.',
        key: 'O defeito não derruba nada; só uma métrica de negócio o enxerga.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'new')); even(o, 0, 1, 2); lena(o, 1, 0.4, false); o.rows.rev = act('revisões', 'LIMITE: 10', ['2.5.0 · atual', 'acc'], ['2.4.0 · anterior', 'dim']);
          const s = Math.floor(lin(t, 4.2, 9, 1, 6)), done = t > 4.2;
          db(o, ['1059 · ' + (done ? '49,00' : '…'), done ? 'bad' : 'dim'], ['frete 0,00: ' + (done ? s : 0) + ' linhas', done ? 'bad' : 'dim']); if (done) o.on.db = 'bad';
          o.cnt = [['FRETE 0,00', done ? String(s) : '0', done ? 'bad' : ''], ['PERDA', brl(done ? 15 * s : 0), done ? 'bad' : 'dim'], ['ERROS HTTP', '0%', 'dim']];
          o.res = done ? [['201, saudável e errado', 'bad']] : []; } },
      { id: 'percebe', dur: 7, title: '60 min depois, o financeiro nota: 3.600 pedidos', yk: 'A CONTA',
        code: ['Recife: 5 × 20% = 1 pedido/s', '1/s × 3.600 s = 3.600 pedidos', '3.600 × 15,00 = R$ 54.000', 'achado às 23:00 (9 h depois):', '32.400 pedidos · R$ 486.000'],
        story: 'Ninguém percebe pela saúde do pod, porque ela está boa. Às <b>15:00</b>, uma hora depois, o financeiro estranha o frete de Recife. Em 60 min foram <b>3.600</b> pedidos com frete zero: <b>R$ 54.000</b>. Se o defeito só aparecesse às 23:00, no relatório do módulo 6, seriam 9 h, 32.400 pedidos e R$ 486.000.',
        look: 'O relógio corre de 14:00 a 15:00 e o pg-pedidos acumula linhas vermelhas até 3.600.',
        key: 'Raio de explosão = fração exposta × tempo até perceber × custo por pedido errado.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'new')); even(o, 0, 1, 2); o.rows.rev = act('revisões', 'LIMITE: 10', ['2.5.0 · atual', 'acc'], ['2.4.0 · anterior', 'dim']);
          const s = lin(t, 0.4, 4.6, 0, 3600), n = Math.floor(s);
          db(o, ['frete 0,00: ' + thou(n) + ' linhas', 'bad'], ['perda: ' + brl(15 * n), 'bad']); o.on.db = 'bad';
          if (n >= 3600) T(o, [675, 360, 52], '3.600 pedidos · R$ 54.000', 'bad');
          o.cnt = [['RELÓGIO', hms(s)], ['FRETE 0,00', thou(n), 'bad'], ['PERDA', brl(15 * n), 'bad']];
          o.res = n >= 3600 ? [['1 h de defeito: R$ 54.000', 'bad']] : []; } },
      { id: 'undo', dur: 8, title: 'kubectl rollout undo: de volta à 2.4.0 em 90 s', yk: 'O COMANDO',
        code: ['kubectl rollout undo deployment/pedidos', '→ volta ao ReplicaSet da 2.4.0', 'rolling: 3 ondas × 30 s = 90 s', '% na 2.5.0: 100 → 67 → 33 → 0', 'o código é a 2.4.0 de novo'],
        story: 'A equipe roda <code>kubectl rollout undo deployment/pedidos</code>. O Kubernetes volta ao ReplicaSet anterior, a 2.4.0, com o mesmo rolling: um pod por vez, <b>30 s</b> cada, <b>90 s</b> no total. Os pods da 2.4.0 voltam a cobrar 15,00 de frete para Recife.',
        look: 'Os pods voltam de sódio para cinza, um a cada 30 s. Na prateleira, a 2.4.0 volta a ser a atual.',
        key: 'O rollback troca o código em 90 s.',
        f(o, t) { const s = lin(t, 0.5, 6, 0, 90); let n = 0;
          [0, 1, 2].forEach(i => { const back = s >= 30 * (i + 1), st = !back && s >= 30 * i ? 'start' : 'ok'; if (!back) n++;
            P(o, i, back ? 'old' : 'new', 'ok', st === 'start' ? { sub: '2.4.0 em ' + Math.ceil(30 * (i + 1) - s) + ' s' } : {}); });
          even(o, 0, 1, 2); const ok = s >= 90;
          o.rows.rev = act('revisões', 'LIMITE: 10', [ok ? '2.4.0 · atual de novo' : 'voltando para a 2.4.0', 'acc'], ['2.5.0 · anterior', 'dim']); o.on.rev = 1;
          db(o, ['frete 0,00: 3.600 linhas', 'bad'], ['perda: R$ 54.000', 'bad']); o.on.db = 'bad';
          o.cnt = [['TEMPO', secs(s)], ['NA 2.5.0', pct(n / 3)], ['FRETE 0,00', '3.600', 'bad']];
          o.res = ok ? [['90 s: o código é a 2.4.0', 'acc']] : []; } },
      { id: 'dado', dur: 7, title: 'E se der errado: o código voltou, as 3.600 linhas não', yk: 'O CONSERTO (ESBOÇO)',
        code: ['3.600 linhas seguem com frete 0,00', 'rastro: app_versao = 2.5.0 (ou trace_id)', 'UPDATE pedidos', '   SET frete = 15.00, total = total + 15.00', " WHERE app_versao = '2.5.0'", '   AND CEP em 50000–52999'],
        story: 'Os pods já são 2.4.0, e o pg-pedidos continua com <b>3.600</b> pedidos de Recife gravados com frete 0,00. O rollback troca o código, <b>não o dado</b>. Quem gravou deixou rastro: a coluna <code>app_versao</code> (ou o <code>trace_id</code> no log, módulo 6). O conserto é um <code>UPDATE</code> de reconciliação só sobre essas linhas; a aula 8 mostra por que ele vai em lotes.',
        look: 'Os três pods estão cinza de novo, mas o pg-pedidos segue vermelho: 3.600 linhas. Nenhum cabo volta para desfazê-las.',
        key: 'Rollback troca o código, não o dado.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2);
          o.rows.rev = act('revisões', 'LIMITE: 10', ['2.4.0 · atual', 'acc'], ['2.5.0 · anterior', 'dim']);
          db(o, ['frete 0,00: 3.600 linhas', 'bad'], ['app_versao = 2.5.0', 'bad']); o.on.db = 'bad';
          if (t > 1) T(o, [675, 360, 52], 'o dado não volta', 'bad');
          o.cnt = [['CÓDIGO', '2.4.0'], ['LINHAS ERRADAS', '3.600', 'bad'], ['DESFEITAS', '0', 'bad']];
          o.res = [['o código voltou; o dado ficou', 'bad']]; } },
    ],
    recreate: [
      { id: 'antes', dur: 6, title: 'strategy: Recreate: tudo para antes de subir', yk: 'O YAML',
        code: ['spec:', '  replicas: 3', '  strategy:', '    type: Recreate', '# encerra todos os pods antigos', '# antes de criar os novos'],
        story: 'Com <code>strategy.type: Recreate</code>, o Kubernetes encerra <b>todos</b> os pods antigos antes de criar os novos. É o único modelo em que a 2.4.0 e a 2.5.0 <b>nunca</b> atendem ao mesmo tempo. São 14:00, e os 3 pods da 2.4.0 atendem os 5 pedidos/s.',
        look: 'Os três pods cinza (2.4.0) recebem o tráfego do lb-loja. As três vagas da direita estão vazias: é ali que a 2.5.0 vai subir.',
        key: 'Recreate: nunca duas versões ao mesmo tempo, e o preço é ficar fora do ar.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2);
          o.cnt = [['PODS PRONTOS', '3'], ['VERSÕES NO AR', '1', 'dim'], ['RECUSADOS', '0', 'dim']]; o.res = [['3 pods da 2.4.0', 'dim']]; } },
      { id: 'encerra', dur: 6, title: '0–10 s: os 3 pods antigos são encerrados', yk: 'O RELÓGIO',
        code: ['14:00:00  encerra os 3 pods da 2.4.0', '          10 s para sair', 'pods prontos: 0', 'lb-loja → 503 Service Unavailable', '5 pedidos/s recusados'],
        story: 'Às 14:00:00 os três pods da 2.4.0 recebem o sinal para sair e levam <b>10 s</b> para encerrar. Sem nenhum pod pronto, o <code>lb-loja</code> não tem para onde mandar e devolve <code>503</code>. A 5 pedidos/s, são 50 recusados nesses 10 s.',
        look: 'Os pods cinza ficam sem tráfego e afundam na prancha. Os pontos sobem do lb-loja e voltam vermelhos: 503.',
        key: 'Entre o último pod velho sair e o primeiro novo ficar pronto, ninguém atende.',
        f(o, t) { const s = lin(t, 0.4, 4.5, 0, 10); if (s < 10) [0, 1, 2].forEach(i => P(o, i, 'old', 'stop'));
          lanes(o, ['x', 1]); lb(o, ['nenhum pod pronto', 'bad'], ['503', 'bad']); o.on.lb = 'bad';
          o.cnt = [['RELÓGIO', secs(s)], ['PODS PRONTOS', '0', 'bad'], ['RECUSADOS', thou(5 * s), 'bad']];
          o.res = s >= 10 ? [['10 s: os 3 antigos saíram', 'bad']] : []; } },
      { id: 'sobe', dur: 8, title: '10–40 s: os 3 pods da 2.5.0 sobem, 30 s até ficarem prontos', yk: 'A CONTA',
        code: ['14:00:10  cria 3 pods da 2.5.0', '          30 s até o readiness passar', '14:00:40  3 prontos', 'fora do ar: 10 + 30 = 40 s', '40 s × 5/s  = 200 recusados', '40 s × 30/s = 1.200 (Black Friday)'],
        story: 'Só às 14:00:10 o Kubernetes cria os três pods da 2.5.0. Cada um leva <b>30 s</b> para ficar pronto (a conta do módulo 14). A loja fica <b>40 s</b> fora do ar: <b>200</b> pedidos recusados a 5/s, ou <b>1.200</b> se fosse a Black Friday, a 30/s.',
        look: 'Os pods sódio sobem nas vagas da direita com a barra dos 30 s enchendo. Enquanto isso, o tráfego continua voltando vermelho do lb-loja.',
        key: 'O relógio do recreate é o tempo de encerrar mais o tempo de subir.',
        f(o, t) { const s = lin(t, 0.4, 6, 10, 40), ok = s >= 40;
          [3, 4, 5].forEach(i => P(o, i, 'new', ok ? 'ok' : 'start', { bar: (s - 10) / 30 }));
          if (ok) even(o, 3, 4, 5); else { lanes(o, ['x', 1]); lb(o, ['nenhum pod pronto', 'bad'], ['503', 'bad']); o.on.lb = 'bad'; }
          o.cnt = [['FORA DO AR', secs(s), 'bad'], ['RECUSADOS', thou(5 * s), 'bad'], ['A 30/S', thou(30 * s), 'dim']];
          o.res = ok ? [['40 s fora: 200 recusados', 'bad']] : []; } },
      { id: 'pronto', dur: 7, title: '40 s: uma versão só, 100% na 2.5.0', yk: 'QUANDO VALE',
        code: ['14:00:40  3 pods da 2.5.0 prontos', 'versões no ar ao mesmo tempo: 1', 'vale quando as duas versões', '  não podem coexistir,', 'ou quando a transição custa', '  mais que a parada'],
        story: 'Às 14:00:40 os três pods da 2.5.0 atendem, e nunca houve duas versões no ar. É isso que o recreate compra: vale quando a 2.5.0 troca a representação de um campo que a 2.4.0 não entende, ou quando a transição gradual custa mais que a parada. O artigo diz que só é viável com comunicação assíncrona e consistência eventual; o critério é <b>as versões não poderem coexistir</b>. E o frete zero passa do mesmo jeito: o 1059 da Lena sai por 49,00.',
        look: 'Os três pods sódio da direita recebem todo o tráfego. A ficha 1059 cai num deles e chega vermelha ao pg-pedidos.',
        key: 'Recreate compra uma versão só no ar e paga com o tempo fora.',
        f(o, t) { [3, 4, 5].forEach(i => P(o, i, 'new')); even(o, 3, 4, 5); lena(o, 4, 0.8, false);
          o.cnt = [['NA 2.5.0', '100%'], ['VERSÕES NO AR', '1', 'dim'], ['RECUSADOS', '200', 'bad']];
          o.res = [['uma versão só; 40 s fora do ar', 'acc']]; } },
      { id: 'kafka', dur: 8, title: 'O caso do artigo: o entregas e o rebalance', yk: 'A CONTA DO REBALANCE',
        code: ['entregas: 3 pods · 3 partições', 'rebalance: 6 s cada (exemplo)', 'rolling:  3 trocas × 2 × 6 s = 36 s', 'recreate: 1 rebalance = 6 s', 'hoje: KIP-429 e group.instance.id'],
        story: 'O artigo dá o caso do Kafka: o <code>entregas</code> (3 partições, módulo 13) consome num grupo, e cada pod que entra ou sai dispara um <i>rebalance</i> (no exemplo, <b>6 s</b> parado). Um rolling de 3 pods faz 3 trocas × 2 rebalances × 6 s = <b>36 s</b> de consumo interrompido em partes; o recreate faz <b>1</b> rebalance de 6 s, depois que os 3 novos entram. Correção ao artigo: o rebalance cooperativo (KIP-429) e a associação estática (<code>group.instance.id</code>) reduzem esse custo. Para consumidores Kafka, o recreate é uma opção, não uma exigência.',
        look: 'Os pods viram consumidores do entregas e o lb-loja vira o tópico com 3 partições. Os antigos saem juntos, o grupo para uma vez (6 s) e as 3 partições passam para os novos.',
        key: 'Para o Kafka, o recreate é uma opção, não uma exigência.',
        f(o, t) { const ph = t < 2.4 ? 0 : t < 4.4 ? 1 : 2;
          o.rows.lb = act('Kafka · entregas', '3 PARTIÇÕES', [ph === 1 ? 'rebalance: 6 s parado' : 'consumo normal', ph === 1 ? 'bad' : 'dim']); if (ph === 1) o.on.lb = 'bad';
          o.rows.cli = act('produtores', '', ['eventos de entrega', 'dim']);
          if (ph === 0) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { name: 'consumidor', sub: 'partição ' + i })); even(o, 0, 1, 2); }
          if (ph === 1) { lanes(o, ['x', 1]); T(o, [LBX, 320, 70], 'rebalance · 6 s', 'bad'); }
          if (ph === 2) { [3, 4, 5].forEach((i, k) => P(o, i, 'new', 'ok', { name: 'consumidor', sub: 'partição ' + k })); even(o, 3, 4, 5); }
          o.cnt = [['RECREATE', '6 s'], ['ROLLING', '36 s', 'dim'], ['REBALANCES', '1 contra 6', 'dim']];
          o.res = ph === 2 ? [['1 rebalance; KIP-429 também reduz', 'acc']] : []; } },
      { id: 'naosobe', dur: 9, title: 'E se der errado: a 2.5.0 não sobe, 80 s fora do ar', yk: 'O ERRO',
        code: ['ERROR: column "frete" does not exist', 'a migration não foi aplicada', 'pods da 2.5.0: CrashLoopBackOff', 'pods prontos: 0 · 100% de 503', '40 s + 40 s para voltar = 80 s', '400 recusados (5/s) · 2.400 (30/s)'],
        story: 'Agora a migration não foi aplicada: a 2.5.0 procura a coluna <code>frete</code>, recebe <code>column "frete" does not exist</code> e entra em <i>CrashLoopBackOff</i>. Os três pods da 2.4.0 já tinham saído: <b>0 pods</b>, 100% de <code>503</code>. Desfazer é outro recreate de 40 s: <b>80 s</b> fora do ar, <b>400</b> pedidos recusados a 5/s (<b>2.400</b> na Black Friday).',
        look: 'Os pods da direita sobem e ficam vermelhos, sem passar no readiness. Depois afundam, e a 2.4.0 sobe de novo na esquerda; até lá, o tráfego volta inteiro em vermelho.',
        key: 'No recreate, a versão que não sobe deixa a loja sem nenhum pod.',
        f(o, t) { const s = lin(t, 0.4, 7.4, 0, 80);
          if (s < 10) [0, 1, 2].forEach(i => P(o, i, 'old', 'stop'));
          else if (s < 40) [3, 4, 5].forEach(i => P(o, i, 'new', s < 22 ? 'start' : 'bad', { bar: (s - 10) / 30, note: 'CrashLoopBackOff' }));
          else if (s < 50) [3, 4, 5].forEach(i => P(o, i, 'new', 'stop', { note: 'encerrando' }));
          else [0, 1, 2].forEach(i => P(o, i, 'old', s >= 80 ? 'ok' : 'start', { bar: (s - 50) / 30 }));
          if (s >= 22 && s < 40) T(o, [PC(4), PY + 40, 64], 'column "frete" does not exist', 'bad');
          if (s >= 80) even(o, 0, 1, 2); else { lanes(o, ['x', 1]); lb(o, ['nenhum pod pronto', 'bad'], ['503', 'bad']); o.on.lb = 'bad'; }
          o.cnt = [['FORA DO AR', secs(s), 'bad'], ['RECUSADOS', thou(5 * s), 'bad'], ['A 30/S', thou(30 * s), 'dim']];
          o.res = s >= 80 ? [['80 s sem nenhum pod', 'bad'], ['400 recusados · 2.400 na Black Friday', 'bad']] : []; } },
    ],
    rolling: [
      { id: 'conta', dur: 6, title: '25% de 3 pods: maxSurge 1, maxUnavailable 0', yk: 'O YAML E O ARREDONDAMENTO',
        code: ['strategy:', '  type: RollingUpdate     # o padrão', '  rollingUpdate:', '    maxSurge: 25%         # 0,75 → 1', '    maxUnavailable: 25%   # 0,75 → 0', 'no máximo 4 pods; no mínimo 3 prontos'],
        story: 'O rolling é o padrão do Kubernetes: troca pod por pod. Dois números mandam: <code>maxSurge</code> (quantos pods a mais ele pode criar) e <code>maxUnavailable</code> (quantos podem faltar), <b>25%</b> cada por padrão. Com 3 réplicas, 25% dá 0,75: o surge arredonda <b>para cima</b> (1) e o unavailable <b>para baixo</b> (0). O rolling mais seguro sai de graça, mas sobe um pod por vez.',
        look: 'Os três pods cinza (2.4.0) atendem. A quarta vaga, à direita deles, é a folga do maxSurge: é ali que a 2.5.0 vai nascer.',
        key: 'maxSurge arredonda para cima; maxUnavailable, para baixo.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2); T(o, [PC(3), PY + PD / 2, 30], 'maxSurge: +1 pod', 'acc');
          o.cnt = [['MAXSURGE', '1'], ['MAXUNAVAILABLE', '0', 'dim'], ['% NA 2.5.0', '0%', 'dim']]; o.res = [['sobe 1 pod por vez', 'acc']]; } },
      { id: 'onda1', dur: 7, title: 'Onda 1 (0–30 s): o primeiro pod da 2.5.0 sobe', yk: 'A ONDA 1',
        code: ['0 s   cria 1 pod da 2.5.0 (4 pods)', '      readiness: 30 s', '30 s  pronto → encerra 1 pod da 2.4.0', '% na 2.5.0 de 0 a 30 s: 0%'],
        story: 'No segundo 0 o Kubernetes cria um pod da 2.5.0, o quarto da frota. Ele não recebe nada até o <i>readiness</i> passar, <b>30 s</b> depois. Só então um pod da 2.4.0 é encerrado. De 0 a 30 s, <b>0%</b> do tráfego vê a 2.5.0.',
        look: 'O pod sódio nasce na quarta vaga com a barra de 30 s enchendo; o tráfego segue só para os cinza. Quando a barra fecha, o primeiro cinza afunda.',
        key: 'Nenhum pod novo atende antes de passar no readiness.',
        f(o, t) { const s = lin(t, 0.4, 5, 0, 30), ok = s >= 30;
          if (!ok) P(o, 0, 'old'); else if (t < 5.8) P(o, 0, 'old', 'stop'); P(o, 1, 'old'); P(o, 2, 'old'); P(o, 3, 'new', ok ? 'ok' : 'start', { bar: s / 30 });
          if (ok) even(o, 1, 2, 3); else even(o, 0, 1, 2);
          o.cnt = [['TEMPO', secs(s)], ['% NA 2.5.0', ok ? '33%' : '0%'], ['PODS', ok ? '3' : '4', 'dim']];
          o.res = ok ? [['30 s: troca 1 de 3', 'acc']] : []; } },
      { id: 'onda2', dur: 8, title: 'Onda 2 (30–60 s): 33% na 2.5.0', yk: 'A ONDA 2',
        code: ['30 s  1 de 3 prontos na 2.5.0 → 33%', '      cria o 2º pod da 2.5.0', '60 s  pronto → encerra outro 2.4.0', 'duas versões no lb-loja (round robin)'],
        story: 'De 30 a 60 s, um dos três pods prontos é 2.5.0: pelo round robin do <code>lb-loja</code> (módulo 7), <b>33%</b> dos pedidos já caem nela, e o 1059 da Lena cai. A 2.4.0 e a 2.5.0 atendem <b>ao mesmo tempo</b>, e tudo que as duas tocam (banco, eventos, cache) precisa servir às duas: é o assunto da aula 8.',
        look: 'Um terço dos pontos agora é sódio e vai para o pod novo; a ficha 1059 vai junto. O segundo pod da 2.5.0 nasce com a sua barra de 30 s.',
        key: 'Durante o rolling, as duas versões atendem juntas.',
        f(o, t) { const s = lin(t, 0.4, 6, 30, 60), ok = s >= 60;
          if (!ok) P(o, 1, 'old'); else if (t < 6.8) P(o, 1, 'old', 'stop'); P(o, 2, 'old'); P(o, 3, 'new'); P(o, 4, 'new', ok ? 'ok' : 'start', { bar: (s - 30) / 30 });
          if (ok) even(o, 2, 3, 4); else even(o, 1, 2, 3); lena(o, 3, 0.6, false);
          o.cnt = [['TEMPO', secs(s)], ['% NA 2.5.0', ok ? '67%' : '33%'], ['VERSÕES NO AR', '2', 'dim']];
          o.res = [['2.4.0 e 2.5.0 atendendo juntas', 'acc']]; } },
      { id: 'onda3', dur: 8, title: 'Onda 3 (60–90 s): 67%, e 100% aos 90 s', yk: 'A ONDA 3',
        code: ['60 s  2 de 3 na 2.5.0 → 67%', '      cria o 3º pod da 2.5.0', '90 s  pronto → encerra o último 2.4.0', '      100% na 2.5.0', '3 ondas × 30 s = 90 s, sem downtime'],
        story: 'De 60 a 90 s, dois dos três prontos são 2.5.0: <b>67%</b>. O terceiro passa no readiness aos <b>90 s</b> e o último pod da 2.4.0 sai. Em nenhum momento a loja teve menos de 3 pods prontos.',
        look: 'Dois terços dos pontos vão para os pods sódio. O último cinza afunda quando a terceira barra fecha.',
        key: 'maxUnavailable 0: a capacidade nunca cai durante a troca.',
        f(o, t) { const s = lin(t, 0.4, 6, 60, 90), ok = s >= 90;
          if (!ok) P(o, 2, 'old'); else if (t < 6.8) P(o, 2, 'old', 'stop'); P(o, 3, 'new'); P(o, 4, 'new'); P(o, 5, 'new', ok ? 'ok' : 'start', { bar: (s - 60) / 30 });
          if (ok) even(o, 3, 4, 5); else even(o, 2, 3, 4);
          o.cnt = [['TEMPO', secs(s)], ['% NA 2.5.0', ok ? '100%' : '67%'], ['PRONTOS', '3', 'dim']];
          o.res = ok ? [['90 s, nunca menos de 3 prontos', 'acc']] : []; } },
      { id: 'catalogo', dur: 7, title: 'No catalogo, 10 pods: no mínimo 8 prontos', yk: 'O CATALOGO',
        code: ['catalogo: 10 pods, 100 req/s cada', 'maxSurge 25% × 10 = 2,5 → 3', 'maxUnavailable 2,5 → 2: mínimo 8', '640 ÷ (8 × 100) = 80% · R = 60 ms', 'maxUnavailable 3 → 7 pods:', '91,4% · R = 126,7 ms'],
        story: 'Com o <code>catalogo</code> (10 pods, 100 req/s cada) os mesmos 25% dão <code>maxSurge</code> <b>3</b> e <code>maxUnavailable</code> <b>2</b>. Durante a troca ficam no mínimo <b>8</b> prontos: a 640 req/s, a CPU vai a <b>80%</b> e a resposta a <b>60 ms</b> (a tabela do módulo 14). Com <code>maxUnavailable</code> 3 seriam 7 pods: <b>91,4%</b> e <b>126,7 ms</b>.',
        look: 'Atrás, os 10 pods do catalogo: dois cinza afundam juntos e três sódio nascem na folga. O mostrador faz a conta com os 8 que sobram.',
        key: 'maxUnavailable decide quanta capacidade a troca tira da frota.',
        f(o, t) { [3, 4, 5].forEach(i => P(o, i, 'new')); even(o, 3, 4, 5); const s = lin(t, 0.5, 4.5, 0, 30), ok = s >= 30;
          for (let j = 0; j < 10; j++) C(o, j, 'old', j < 2 ? (ok ? 'gone' : 'stop') : 'ok');
          for (let j = 10; j < 13; j++) C(o, j, 'new', ok ? 'ok' : 'start', { bar: s / 30 });
          T(o, [CCc(1), CY + 10, 52], 'maxUnavailable: 2', 'bad'); T(o, [CCc(11), CY + 10, 52], 'maxSurge: 3', 'acc');
          o.cnt = [['MÍNIMO PRONTOS', '8'], ['CPU NO MÍNIMO', '80%', 'dim'], ['RESPOSTA', '60 ms', 'dim']];
          o.res = [['com 3 fora: 91,4% e 126,7 ms', 'bad']]; } },
      { id: 'passa', dur: 8, title: 'E se der errado: o frete zero passa por todos os portões', yk: 'OS PORTÕES',
        code: ['readinessProbe: 200 ✓', 'erros 5xx: 0% ✓ · latência: igual ✓', 'progressDeadlineSeconds: avançou ✓', 'nenhum portão mede o frete', '1/s × 15,00 = R$ 15 por segundo', '60 min: 3.600 pedidos · R$ 54.000'],
        story: 'O rolling confere <b>saúde</b>: <code>readinessProbe</code>, <code>minReadySeconds</code>, <code>progressDeadlineSeconds</code>. O artigo diz que não há validações intermediárias; há esses portões, mas nenhum olha o resultado de negócio. A 2.5.0 passa em todos com o frete zero: aos 90 s está em 100%, e a loja perde <b>R$ 15 por segundo</b> até alguém notar (R$ 54.000 em 60 min).',
        look: 'Os três pods sódio passaram no readiness e recebem tudo. A ficha 1059 chega vermelha ao pg-pedidos, e a perda sobe até R$ 54.000.',
        key: 'O rolling só confere saúde, e o frete zero é saudável.',
        f(o, t) { [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { sub: 'readiness ✓' })); even(o, 3, 4, 5); lena(o, 4, 0.4, false);
          const s = lin(t, 4.4, 7.6, 0, 3600), n = Math.floor(s);
          if (t > 4.2) { db(o, ['frete 0,00: ' + thou(n) + ' linhas', 'bad'], ['perda: ' + brl(15 * n), 'bad']); o.on.db = 'bad'; }
          o.cnt = [['RELÓGIO', hms(s)], ['FRETE 0,00', thou(n), 'bad'], ['PERDA', brl(15 * n), 'bad']];
          o.res = n >= 3600 ? [['R$ 15/s até alguém notar', 'bad']] : []; } },
    ],
    bluegreen: [
      { id: 'dois', dur: 6, title: 'Blue e green: 3 + 3 pods e um ponteiro', yk: 'OS DOIS AMBIENTES',
        code: ['blue  = 2.4.0 · 3 pods · atende', 'green = 2.5.0 · 3 pods · sem cliente', 'Service pedidos → blue', 'banco: um só (pg-pedidos)', 'catalogo na Black Friday: 10 + 10', '= 10 réplica-horas a mais por hora'],
        story: 'O blue/green sobe a 2.5.0 inteira <b>ao lado</b> da 2.4.0: <i>blue</i> são os 3 pods da 2.4.0, que atendem; <i>green</i> são 3 pods da 2.5.0, do mesmo tamanho, sem nenhum cliente. O Service do <code>pedidos</code> aponta para um dos dois. O banco é um só: os dois ambientes gravam no mesmo <code>pg-pedidos</code>, e voltar para o blue não desfaz o que o green gravou.',
        look: 'À esquerda o blue (cinza) recebe o tráfego pelo ponteiro do lb-loja; à direita o green (sódio) está pronto e parado.',
        key: 'Dois ambientes iguais e um ponteiro que escolhe qual atende.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE' })); [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'sem cliente' })); even(o, 0, 1, 2);
          lb(o, ['Service pedidos', 'dim'], ['→ blue', 'acc']);
          o.cnt = [['PODS', '3 + 3'], ['ATENDE', 'blue', 'dim'], ['NO GREEN', '0%', 'dim']]; o.res = [['o dobro de pods durante a troca', 'dim']]; } },
      { id: 'fumaca', dur: 7, act: 'teste', title: 'O teste de fumaça no green, sem cliente', yk: 'O TESTE',
        code: () => actv.teste ? ['previewService → green', 'POST /pedidos · CEP de Recife', '→ 201 · frete 0,00 · total 49,00', 'esperado: 64,00 ✗', 'a loja não vira: R$ 0'] : ['previewService → green', 'POST /pedidos · CEP de SP', '→ 201 · frete 9,00 ✓', 'nenhum pedido de Recife no teste', 'a loja vira com o defeito dentro'],
        story: 'Antes de virar, o green recebe testes de fumaça (módulo 24), <i>warm-up</i> e validações <b>sem cliente</b>, pelo serviço de prévia. O teste só pega o frete zero <b>se</b> criar um pedido para Recife. Escolha acima: sem Recife o green passa e a virada leva o defeito junto (R$ 54.000 em 60 min); com Recife o teste vê 49,00 onde esperava 64,00, e a loja não vira (R$ 0).',
        look: 'O teste, atrás, manda um pedido ao green pela prévia, enquanto o blue continua atendendo os clientes. O resultado aparece em cima do green.',
        key: 'O green só é testado no que o teste pede.',
        f(o, t) { const rec = actv.teste === 1; [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE' })); [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'sem cliente' })); even(o, 0, 1, 2);
          lb(o, ['Service pedidos', 'dim'], ['→ blue', 'acc']); o.on.tst = 1;
          const a = send(o, backLane(4), t, 0.6, 2.4, rec ? 'teste · Recife' : 'teste · SP'), r = t > 2.6;
          o.rows.tst = act('teste de fumaça', 'SEM CLIENTE', ['pedido de teste: ' + (rec ? 'Recife' : 'SP'), 'dim'], [r ? (rec ? '201 · frete 0,00 ✗' : '201 · frete 9,00 ✓') : '…', r ? (rec ? 'bad' : 'acc') : 'dim']);
          if (r) { if (rec) o.pods[4] = { v: 'new', st: 'bad', meta: 'GREEN', note: 'frete 0,00' }; T(o, [PC(4), PY + 30, 62], rec ? 'barrado: 49,00 ≠ 64,00' : 'passou: vira com o defeito', rec ? 'acc' : 'bad'); }
          o.cnt = [['TESTE', rec ? 'Recife' : 'SP'], ['RESULTADO', r ? (rec ? 'barra' : 'passa') : '…', r ? (rec ? '' : 'bad') : 'dim'], ['RISCO', rec ? 'R$ 0' : 'R$ 54.000', rec ? 'dim' : 'bad']];
          o.res = r ? (rec ? [['barrado antes de algum cliente ver', 'acc']] : [['a virada leva o defeito junto', 'bad']]) : []; } },
      { id: 'virada', dur: 8, title: 'A virada: o ponteiro troca em ~1 s, o fluxo não', yk: 'A VIRADA',
        code: ['kubectl argo rollouts promote pedidos', 'Service pedidos → green   (~1 s)', 'keep-alive, HTTP/2, gRPC longos:', '  seguem no blue até fechar', 'virada por DNS: vale o TTL', 'blue de pé: voltar = ~1 s'],
        story: 'Virar é trocar o ponteiro: o Service passa a apontar para o green em <b>~1 s</b>. Só que as conexões já abertas (HTTP keep-alive, HTTP/2, gRPC de longa duração, módulo 12) continuam nos pods do blue até fecharem, e uma virada por DNS espera o TTL (módulo 1). O instantâneo é o ponteiro, não o fluxo. Enquanto o blue estiver de pé, voltar é trocar o ponteiro de novo: ~1 s.',
        look: 'O ponteiro do lb-loja passa do blue para o green. Alguns pontos ainda seguem para o blue por um tempo: são as conexões que já estavam abertas.',
        key: 'Instantâneo é o ponteiro, não o fluxo.',
        f(o, t) { const sw = t > 1.6, rest = sw ? lin(t, 1.6, 5.5, 0.34, 0) : 1;
          [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE', note: sw ? (rest > 0 ? 'conexões antigas' : 'de pé, sem tráfego') : 'pronto' }));
          [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: sw ? 'atende' : 'sem cliente' }));
          lanes(o, ...[0, 1, 2].map(i => ['p' + i, rest / 3]), ...[3, 4, 5].map(i => ['p' + i, (1 - rest) / 3]));
          lb(o, ['Service pedidos', 'dim'], [sw ? '→ green' : '→ blue', 'acc']); o.on.lb = sw ? 1 : 0;
          o.cnt = [['PONTEIRO', sw ? 'green' : 'blue'], ['VIRADA', '~1 s', 'dim'], ['AINDA NO BLUE', pct(rest), 'dim']];
          o.res = sw && rest <= 0 ? [['o fluxo inteiro no green', 'acc']] : sw ? [['o ponteiro virou; o fluxo, aos poucos', 'dim']] : []; } },
      { id: 'frio', dur: 8, title: 'E se der errado: o green frio forma fila', yk: 'A LEI DE LITTLE',
        code: ['catalogo: 640 req/s · 10 + 10 pods', 'quente: 640 × 0,02 s = 12,8 em voo', 'frio:   640 × 0,2 s  = 128 em voo', '10 pods × 10 workers = 100', '128 > 100 → fila (CPU a 64%)', 'conserto: warm-up antes de virar'],
        story: 'No <code>catalogo</code> da Black Friday (10 + 10 pods) o green nasce com o cache local <b>vazio</b>: a primeira requisição leva <b>200 ms</b> em vez de 20 ms (exemplo). Pela Lei de Little (módulo 23), 640 req/s × 0,2 s = <b>128</b> requisições em voo, contra <b>12,8</b> no quente. Com 10 workers por pod (módulo 11), os 10 pods aguentam <b>100</b> em voo: o green <b>forma fila</b> com a CPU a 64%. O conserto é aquecer o green antes da virada, com tráfego sintético ou espelho.',
        look: 'Atrás, os 10 pods do catalogo green recebem a virada inteira. Na frente deles cresce uma fila vermelha: 128 em voo para 100 workers.',
        key: 'Virar para um green frio é virar para uma fila.',
        f(o, t) { delete o.show.tst; for (let j = 0; j < 10; j++) C(o, j, 'new', 'ok'); const k = clamp((t - 1) / 4);
          lanes(o, ...Array.from({ length: 10 }, (_, j) => ['c' + j, 0.1])); lb(o, ['Service catalogo', 'dim'], ['→ green (frio)', 'acc']); o.on.lb = 1;
          const q = Math.round(k * 12); for (let i = 0; i < q; i++) o.dots.push([[CCc(i % 10), CY + CD + 14 + Math.floor(i / 10) * 16, 14], 'bad']);
          if (q) o.beams.push({ pts: [[CCc(0) - 8, CY + CD + 14, 8], [CCc(9) + 8, CY + CD + 14, 8]], tone: 'bad' });
          T(o, [CCc(5), CY - 10, 92], 'green · catalogo · 10 pods', 'acc'); if (k >= 1) T(o, [CCc(5), CY + CD + 60, 18], 'fila: 128 em voo × 100 workers', 'bad');
          o.cnt = [['EM VOO', String(Math.round(lin(t, 1, 5, 12.8, 128))), k > 0.5 ? 'bad' : ''], ['WORKERS', '100', 'dim'], ['CPU', '64%', 'dim']];
          o.res = k >= 1 ? [['fila com a CPU a 64%', 'bad'], ['aquecer antes de virar', 'acc']] : []; } },
      { id: 'lab', dur: 8, title: 'O lab: o blueGreen do Argo Rollouts', yk: 'blue-green/automated',
        code: ['blueGreen:   # 5 réplicas', '  activeService: chip', '  previewService: chip-green', '  autoPromotionEnabled: false', '  scaleDownDelaySeconds: 60', '  prePromotionAnalysis: cassowary + ≥ 0.95'],
        story: 'No repositório público do autor, o <code>blueGreen</code> do Argo Rollouts tem <b>5</b> réplicas, <code>activeService: chip</code> (o que atende), <code>previewService: chip-green</code> (o green, para teste), <code>autoPromotionEnabled: false</code> (alguém aprova a virada) e <code>scaleDownDelaySeconds: 60</code> (o blue fica 60 s de pé depois da virada). A versão <code>automated</code> roda antes da promoção um <i>Job</i> <code>cassowary -c 3 -n 1000</code> contra o green e exige <code>result[0] >= 0.95</code> de sucesso no Prometheus. Isso pega <code>500</code>s sem cliente; <b>não</b> pega o frete zero, porque <code>201</code> é sucesso. E 0,95 aceita <b>5%</b> de erro, longe da meta da loja (0,1%).',
        look: 'O bloco de trás vira a análise do lab: 1.000 requisições contra o green, todas 201. A taxa de sucesso dá 100% e a promoção é liberada com o frete zero dentro.',
        key: 'A análise do lab mede erro HTTP, e o frete zero responde 201.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE' })); [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'sob teste' })); even(o, 0, 1, 2);
          lb(o, ['activeService: chip', 'dim'], ['→ blue', 'acc']); o.on.tst = 1; const n = Math.round(lin(t, 0.5, 5.5, 0, 1000));
          o.rows.tst = act('prePromotionAnalysis', 'O LAB', ['cassowary -c 3 -n 1000', 'dim'], ['sucesso ≥ 0,95: ' + (n ? '100%' : '…'), 'acc']);
          if (t < 5.6) [3, 4, 5].forEach((i, k) => pk(o, backLane(i), ((clk * 0.7 + k / 3) % 1), '', '')); [3, 4, 5].forEach(i => o.beams.push({ pts: backLane(i), on: t < 5.6 }));
          if (t > 5.6) T(o, [PC(4), PY + 30, 62], 'promoção liberada', 'bad');
          o.cnt = [['REQUISIÇÕES', thou(n)], ['SUCESSO', n ? '100%' : '…', 'dim'], ['FRETE 0 VISTO', 'não', 'bad']];
          o.res = t > 5.6 ? [['201 é sucesso: o defeito passa', 'bad']] : []; } },
      { id: 'janela', dur: 10, act: 'janela', title: 'E se der errado: o defeito aparece aos 8 min', yk: 'A JANELA DE VOLTA',
        code: () => { const D = [30, 60, 600][actv.janela], alive = D > 480; return ['14:00:00  virada para o green', 'scaleDownDelaySeconds: ' + ['30', '60', '600'][actv.janela], 'blue desligado às ' + hms(D), '14:08:00  alguém nota o frete zero', alive ? 'blue de pé: ponteiro de volta, ~1 s' : 'blue já saiu: subir 3 pods + 30 s']; },
        story: 'Depois da virada o blue fica de pé por <code>scaleDownDelaySeconds</code>: <b>30 s</b> no padrão do Argo, <b>60 s</b> no lab. Se o frete zero só aparece <b>8 min</b> depois, o blue já foi desligado, e voltar é <b>subir 3 pods e esperar 30 s</b>: a janela do ~1 s fechou. Teste os três valores acima. O conserto é dar à janela o tamanho do tempo de <b>detecção</b>, não o da virada.',
        look: 'O relógio corre da virada até 14:08. O blue afunda quando a janela vence; se ainda estiver de pé aos 8 min, o ponteiro volta para ele na hora.',
        key: 'A janela de volta tem que ser maior que o tempo de perceber.',
        f(o, t) { const D = [30, 60, 600][actv.janela], s = lin(t, 0.4, 6, 0, 480), seen = s >= 480, alive = D > 480;
          if (s < D) [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE', note: seen ? 'atende de novo' : 'de pé, sem tráfego' }));
          else if (seen) [0, 1, 2].forEach(i => P(o, i, 'old', 'start', { meta: 'BLUE', bar: lin(t, 6.2, 9.4, 0, 1) }));
          [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'atende' }));
          if (seen && alive) even(o, 0, 1, 2); else even(o, 3, 4, 5);
          lb(o, ['Service pedidos', 'dim'], [seen && alive ? '→ blue (voltou)' : '→ green', 'acc']);
          if (seen) T(o, [PC(4), PY + 30, 62], '14:08: frete zero!', 'bad');
          o.cnt = [['RELÓGIO', hms(s)], ['BLUE', s < D ? 'de pé' : 'desligado', s < D ? 'dim' : 'bad'], ['VOLTAR', seen ? (alive ? '~1 s' : '30 s') : '…', seen ? (alive ? '' : 'bad') : 'dim']];
          o.res = seen ? (alive ? [['janela > 8 min: voltou em ~1 s', 'acc']] : [['a janela fechou: subir e esperar 30 s', 'bad']]) : []; } },
    ],
    canary: [
      { id: 'cabecalho', dur: 6, title: '0%: só quem manda x-versao: v2', yk: 'O PLANO DA LOJA',
        code: ['0%    cabeçalho x-versao: v2', '      (a equipe e os clientes sintéticos)', '10%   por 5 min + análise', '50%   por 5 min + análise', '100%', 'canary × estável no mesmo intervalo'],
        story: 'O canary manda uma <b>fatia</b> do tráfego real para a 2.5.0 e mede antes de crescer. O plano da loja (o canary do módulo 8 e a malha do módulo 10): <b>0%</b> do público, só quem manda o cabeçalho <code>x-versao: v2</code> (a equipe e os clientes sintéticos); depois <b>10%</b> por 5 min, <b>50%</b> por 5 min e <b>100%</b>. Cada degrau compara o canary com o estável <b>no mesmo intervalo</b> (SRE Workbook), não com o dia anterior.',
        look: 'Um pod sódio, o canary, fica ao lado dos três cinza. Só o pedido com o cabeçalho chega nele; os clientes seguem para o estável.',
        key: 'Canary é uma fatia do tráfego real que mede antes de crescer.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'só x-versao: v2' }); even(o, 0, 1, 2);
          lb(o, ['malha: peso 0%', 'dim'], ['x-versao: v2 → canary', 'acc']); const f = ((clk * 0.35) % 1); pk(o, podLane(3), f, 'x-versao: v2', '');
          o.beams.push({ pts: podLane(3), on: true });
          o.cnt = [['PESO', '0%'], ['ESTÁVEL', '3 pods', 'dim'], ['CANARY', '1 pod', 'dim']]; o.res = [['nenhum cliente exposto', 'acc']]; } },
      { id: 'dez', dur: 8, title: '10% por 5 min: a Lena cai no canary', yk: 'O DEGRAU DE 10%',
        code: ['setWeight: 10   (malha: peso exato)', 'sem malha: peso por pod, 1 de 3 = 33%', '5 × 300 s × 10% = 150 pedidos', '150 × 20% = 30 de Recife', '1059 · Lena → canary → 49,00'],
        story: 'O peso sobe para <b>10%</b>. Com a malha (módulo 10) o peso é exato; sem <code>trafficRouting</code>, o Argo Rollouts aproxima pelo <b>número de pods</b>, e com 3 pods o mínimo seria 1 de 3 = <b>33%</b>. Em 5 min a 5 pedidos/s, o canary recebe <b>150</b> pedidos, <b>30</b> de Recife. Um deles é o 1059 da Lena, que sai por 49,00.',
        look: 'Um em cada dez pontos vai para o canary sódio. A ficha 1059 cai nele e chega vermelha ao pg-pedidos.',
        key: 'A malha dá o peso exato; sem ela, o peso é a fração de pods.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'peso 10%' });
          lanes(o, ['p0', 0.3], ['p1', 0.3], ['p2', 0.3], ['p3', 0.1]); lb(o, ['malha: peso 10%', 'acc'], ['estável 90%', 'dim']); lena(o, 3, 0.5, false);
          const n = Math.round(lin(t, 0.5, 7, 0, 150));
          if (t > 4.4) { db(o, ['1059 · 49,00', 'bad'], ['frete 0,00: ' + Math.round(n / 5) + ' linhas', 'bad']); o.on.db = 'bad'; }
          o.cnt = [['NO CANARY', thou(n)], ['DE RECIFE', String(Math.round(n / 5)), 'bad'], ['PESO', '10%', 'dim']];
          o.res = n >= 150 ? [['5 min: 150 pedidos, 30 de Recife', 'bad']] : []; } },
      { id: 'analise', dur: 8, act: 'analise', title: 'Aos 5 min, a análise decide: o que ela mede?', yk: 'A CONSULTA',
        code: () => actv.analise ? ['sum(increase(pedidos_criados_total{', '  versao="2.5.0",frete="0"}[5m])) by (cidade)', 'successCondition: result[0] == 0', 'Recife: 30 → falha → aborta', 'peso 0 em segundos', '30 × 15,00 = R$ 450'] : ['sum(irate(istio_requests_total{', '  response_code!~"5.*"}[5m])) / sum(irate(…))', 'successCondition: result[0] >= 0.95', '5xx no canary: 0% → passa', '→ setWeight 50: 750 pedidos, 150 de Recife', 'perda no degrau de 50%: R$ 2.250'],
        story: 'Aos 5 min, a análise decide. A do lab olha só os <code>5xx</code> e aceita 95% de sucesso: o canary tem 0% de erro, <b>passa</b> e sobe para 50% (nesse degrau seriam 750 pedidos, 150 de Recife, R$ 2.250). A da loja soma a <b>métrica de negócio</b>: pedidos da 2.5.0 com frete zero, por cidade. Recife dá <b>30</b>, a condição <code>== 0</code> falha e o canary <b>aborta</b>: peso 0 em segundos e <b>R$ 450</b> de perda. A consulta da loja é uma adaptação, não executada.',
        look: 'A análise acende atrás e puxa um cabo até o canary. Com o lab, um segundo pod sódio nasce e metade dos pontos vai para a 2.5.0; com a loja, o canary fica vermelho e o tráfego volta todo para os cinza.',
        key: 'Quem decide o canary é o que a análise mede.',
        f(o, t) { const loja = actv.analise === 1, dec = t > 2.4; [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' }));
          o.on.ana = dec ? (loja ? 'bad' : 1) : 1; if (!(dec && loja && t >= 4.6)) o.beams.push({ pts: backLane(3), on: !dec || !loja, tone: dec && loja ? 'bad' : '' });
          o.rows.ana = act('análise', loja ? 'A LOJA' : 'O LAB', [loja ? '5xx e frete_zero{cidade}' : '5xx: result[0] >= 0.95', 'dim'],
            [dec ? (loja ? 'Recife: 30 → aborta' : 'sucesso 100% → passa') : 'medindo…', dec ? (loja ? 'bad' : 'acc') : 'dim']);
          if (!dec) { P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'peso 10%' }); lanes(o, ['p0', 0.3], ['p1', 0.3], ['p2', 0.3], ['p3', 0.1]); }
          else if (loja) { if (t < 4.6) P(o, 3, 'new', 'bad', { meta: 'CANARY', note: 'abortado · peso 0' }); even(o, 0, 1, 2); lb(o, ['malha: peso 0', 'acc'], ['estável 100%', 'dim']);
            T(o, [PC(3), PY + 30, 62], 'aborta: frete zero em Recife', 'acc'); }
          else { P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'peso 50%' }); P(o, 4, 'new', t > 4.6 ? 'ok' : 'start', { meta: 'CANARY', bar: lin(t, 2.4, 4.6, 0, 1) });
            lanes(o, ['p0', 1 / 6], ['p1', 1 / 6], ['p2', 1 / 6], ['p3', 0.25], ['p4', 0.25]); lb(o, ['malha: peso 50%', 'bad'], ['o defeito dentro', 'bad']);
            T(o, [PC(4), PY + 30, 62], 'passou: sobe a 50%', 'bad'); }
          if (loja) db(o, ['frete 0,00: 30 linhas', 'bad'], ['perda: R$ 450', 'bad']); else db(o, ['frete 0,00: 30 linhas', 'bad'], [dec ? 'a 50%: +150 de Recife' : 'perda: R$ 450', 'bad']); o.on.db = 'bad';
          o.cnt = loja ? [['FRETE 0 RECIFE', '30', 'bad'], ['DECISÃO', dec ? 'aborta' : '…'], ['PERDA', 'R$ 450', 'dim']] : [['5xx', '0%'], ['DECISÃO', dec ? 'sobe a 50%' : '…', 'bad'], ['RISCO NO 50%', 'R$ 2.250', 'bad']];
          o.res = dec ? (loja ? [['abortou em 5 min: R$ 450', 'acc']] : [['passou com o defeito dentro', 'bad']]) : []; } },
      { id: 'lacunas', dur: 7, title: 'O canary do lab: o que ele deixa de fora', yk: 'canary/analysis/canary.yml',
        code: ['setWeight 20 → pause 30s → analysis', 'setWeight 50 → pause 1m  → analysis', 'setWeight 100', 'interval: 2m · count: 1 · failureLimit: 1', 'successCondition: result[0] >= 0.95', 'irate(…[5m]) · destination_service=chip'],
        story: 'O <code>analysis/canary.yml</code> do repositório do autor (10 réplicas) faz 20% → pausa de 30 s → análise → 50% → pausa de 1 min → análise → 100%. É um exemplo mínimo e deixa cinco coisas de fora: (1) <code>>= 0.95</code> tolera 5% de <code>5xx</code>, e a meta da loja é 99,9%; (2) <code>201</code> com frete 0 conta como sucesso; (3) <code>destination_service</code> mede o serviço inteiro, estável + canary, e dilui o erro do canary pelo peso; (4) <code>irate</code> é para gráficos, e regras e alertas usam <code>rate</code>; (5) <code>count: 1</code> é uma medição só.',
        look: 'A análise, atrás, puxa cabos para os quatro pods: estável e canary medidos juntos. É a diluição: o canary é 20% do que a consulta soma.',
        key: 'Medir o serviço inteiro dilui o canary pelo peso.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'peso 20%' });
          lanes(o, ['p0', 0.8 / 3], ['p1', 0.8 / 3], ['p2', 0.8 / 3], ['p3', 0.2]); lb(o, ['malha: peso 20%', 'acc'], ['o lab', 'dim']);
          o.on.ana = 1; o.rows.ana = act('análise do lab', 'COUNT: 1', ['5xx · serviço inteiro', 'bad'], ['result[0] >= 0.95', 'dim']);
          [0, 1, 2, 3].forEach(i => o.beams.push({ pts: backLane(i), on: true, tone: i < 3 ? 'bad' : '' }));
          T(o, [PC(1), PY - 10, 58], 'estável também entra na conta', 'bad');
          o.cnt = [['PESO', '20%'], ['A CONSULTA MEDE', '4 pods', 'bad'], ['MEDIÇÕES', '1', 'dim']];
          o.res = [['5% tolerado · só 5xx · diluído', 'bad'], ['irate · count: 1', 'bad']]; } },
      { id: 'amostra', dur: 8, title: 'E se der errado: 150 pedidos é pouca amostra', yk: 'O PODER DA AMOSTRA',
        code: ['erro raro da 2.5.0: 1% (10× a meta)', 'P(nenhum erro em 150) = 0,99^150 = 22%', 'ver ≥ 1 erro com 95% de confiança:', '  ln(0,05) ÷ ln(0,99) = 298 requisições', '298 a 0,5/s = 10 min · a 64/s = 4,7 s', 'decidir por amostra, não por relógio'],
        story: 'Troque o defeito: em vez do frete, um erro <b>raro</b>, de 1% (dez vezes a meta). Em 5 min o canary vê 150 pedidos, e a chance de <b>não ver nenhum erro</b> é 0,99<sup>150</sup> = <b>22%</b>: uma vez em cada cinco, a janela passa e o canary sobe para 50% com o defeito. Para ver ao menos um erro com 95% de confiança são <b>298</b> requisições: <b>10 min</b> a 0,5/s. O <code>catalogo</code>, a 64/s, junta isso em 4,7 s. O frete de Recife é diferente: é 100% determinístico, e os 30 pedidos o denunciam no primeiro degrau.',
        look: 'Os pontos entram no canary, nenhum vermelho. Enquanto a contagem sobe até 150, o mostrador mostra a chance de a janela passar sem ver nada cair para 22%.',
        key: 'Decida por número de requisições, não por minutos.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'erro raro: 1%' });
          lanes(o, ['p0', 0.3], ['p1', 0.3], ['p2', 0.3], ['p3', 0.1]); lb(o, ['malha: peso 10%', 'acc'], ['5 min', 'dim']);
          const n = Math.round(lin(t, 0.5, 6, 0, 150)), p = 0.99 ** n;
          o.on.ana = 1; o.rows.ana = act('análise', 'JANELA: 5 MIN', ['amostra: ' + n + ' pedidos', 'dim'], ['erros vistos: 0', 'bad']);
          o.cnt = [['NO CANARY', String(n)], ['ERROS VISTOS', '0', 'dim'], ['CHANCE DE NÃO VER', pct(p), n >= 150 ? 'bad' : 'dim']];
          o.res = n >= 150 ? [['22%: a janela passa sem ver', 'bad'], ['298 requisições = 10 min', 'acc']] : []; } },
      { id: 'relogio', dur: 8, title: 'E se der errado: canary por relógio chega a 100% em 50 s', yk: 'canary/time/canary.yml',
        code: ['setWeight 0  → pause 10s', 'setWeight 10 → pause 10s', 'setWeight 20 → pause 10s → 40 → 10s', 'setWeight 80 → pause 10s → 100', '0 → 100% em 50 s, sem olhar métrica', 'rolling de 3 pods: 90 s'],
        story: 'O <code>time</code> do lab troca as pausas manuais (<code>pause: {}</code>, em que alguém promove com <code>kubectl argo rollouts promote</code>) por <code>duration: 10s</code>. O canary passa por 0 → 10 → 20 → 40 → 80 → 100% em <b>50 s</b>, sem olhar nenhuma métrica: mais rápido que o rolling de 3 pods (90 s). Canary por relógio, sem análise, é um rolling com mais passos.',
        look: 'O peso do canary sobe sozinho a cada 10 s e os pods sódio tomam a frota. A análise, atrás, nunca acende.',
        key: 'Canary por tempo, sem análise, é rolling com mais passos.',
        f(o, t) { const s = lin(t, 0.4, 6.2, 0, 50), W_ = [0, 10, 20, 40, 80, 100][Math.min(5, Math.floor(s / 10))] / 100;
          const nc = W_ >= 0.8 ? 3 : W_ >= 0.4 ? 2 : 1; for (let i = 0; i < 3; i++) if (W_ < 1) P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' });
          for (let k = 0; k < nc; k++) P(o, 3 + k, 'new', 'ok', { meta: 'CANARY', note: 'peso ' + Math.round(W_ * 100) + '%' });
          lanes(o, ...(W_ < 1 ? [0, 1, 2].map(i => ['p' + i, (1 - W_) / 3]) : []), ...Array.from({ length: nc }, (_, k) => ['p' + (3 + k), W_ / nc]));
          lb(o, ['peso ' + Math.round(W_ * 100) + '%', 'acc'], ['duration: 10s', 'dim']);
          o.rows.ana = act('análise', 'NENHUMA', ['só o relógio', 'dim'], ['—', 'dim']);
          o.cnt = [['TEMPO', secs(s)], ['PESO', pct(W_)], ['ANÁLISES', '0', 'bad']];
          o.res = s >= 50 ? [['100% em 50 s, sem medir nada', 'bad']] : []; } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  const codeOf = s => typeof s.code === 'function' ? s.code() : s.code;
  let SP = null;

  // converte pods, catalogo, tráfego e a ficha 1059 em peças, cabos e pontos
  function finish(o, t) {
    o.pods.forEach((p, i) => { if (!p || p.st === 'gone') return; const nm = 'p' + i; o.show[nm] = 1;
      const ver = p.v === 'new' ? '2.5.0' : '2.4.0';
      const state = p.st === 'start' ? ['pronto em ' + Math.max(1, Math.ceil(30 * (1 - clamp(p.bar || 0)))) + ' s', 'acc'] : p.st === 'stop' ? [p.note || 'encerrando', 'dim'] : p.st === 'bad' ? [p.note || 'CrashLoopBackOff', 'bad'] : [p.note || 'pronto', p.v === 'new' ? 'acc' : 'dim'];
      o.rows[nm] = { name: ver, meta: '', rows: [[p.sub || [p.name, p.meta && p.meta.toLowerCase()].filter(Boolean).join(' · ') || 'pod ' + (i + 1), 'dim'], state], bar: p.st === 'start' ? clamp(p.bar || 0) : null, pod: 1 };
      o.on[nm] = p.st === 'bad' ? 'bad' : p.st === 'stop' ? 0 : p.st === 'start' ? 2 : p.v === 'new' ? 1 : 0; });
    o.cat.forEach((p, j) => { if (!p || p.st === 'gone') return; const nm = 'c' + j; o.show[nm] = 1;
      o.rows[nm] = { name: p.v === 'new' ? '2.5' : '2.4', meta: '', rows: [], bar: p.st === 'start' ? clamp(p.bar || 0) : null, mini: 1 };
      o.on[nm] = p.st === 'stop' ? 0 : p.st === 'start' ? 2 : p.v === 'new' ? 1 : 0; });
    // tráfego: 12 pontos por ciclo, repartidos pelos pesos (maior resto)
    if (o.lanes && o.lanes.length) {
      const K = 12, tot = o.lanes.reduce((a, [, f]) => a + f, 0), want = o.lanes.map(([k, f]) => [k, f / tot * K]);
      const cnt = want.map(([k, v]) => [k, Math.floor(v), v - Math.floor(v)]); let left = K - cnt.reduce((a, c) => a + c[1], 0);
      cnt.slice().sort((a, b) => b[2] - a[2]).forEach(c => { if (left > 0 && c[2] > 0.001) { c[1]++; left--; } });
      const slots = []; cnt.forEach(([k, n]) => { for (let i = 0; i < n; i++) slots.push(k); });
      // espalha os alvos para os pontos não andarem em bloco
      const order = slots.map((k, i) => [k, (i * 7) % K]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
      const seen = new Set();
      order.forEach((k, i) => { const f = (clk * 0.55 + i / K) % 1; let pts, tone;
        if (k === 'x') { pts = refLane(i % 6); tone = 'bad'; }
        else if (k[0] === 'p') { const j = +k.slice(1), p = o.pods[j]; pts = podLane(j); tone = p && p.v === 'new' ? '' : 'old'; }
        else { const j = +k.slice(1), p = o.cat[j]; pts = catLane(j); tone = p && p.v === 'new' ? '' : 'old'; }
        if (!seen.has(k)) { seen.add(k); o.beams.push({ pts: k === 'x' ? [[LBX, 335, 26], [LBX, LANEY - 4, LANEZ + 2]] : pts, on: tone === '', tone: tone === 'bad' ? 'bad' : '' }); }
        pk(o, pts, Math.max(0.002, f), '', tone); });
      [0.15, 0.5, 0.85].forEach(d => pk(o, CLI, (clk * 0.55 + d) % 1 || 0.01, '', 'old'));
      if (o.lanes.some(([k]) => k === 'x')) T(o, [LBX, LANEY - 6, LANEZ + 26], '503', 'bad');
    }
    // a ficha 1059 da Lena
    if (o.lena) { const { i, t0, ok } = o.lena, a = go_(t, t0, t0 + 2.4), b = go_(t, t0 + 2.6, t0 + 3.8);
      if (a < 1) { pk(o, lenaIn(i), Math.max(a, 0.001), LENA, 'acc', true); o.beams.push({ pts: lenaIn(i), on: true }); }
      else if (b < 1) { pk(o, lenaOut(i), Math.max(b, 0.001), ok ? '1059 · 64,00' : '1059 · 49,00 (frete 0,00)', ok ? 'acc' : 'bad', true); o.beams.push({ pts: lenaOut(i), on: ok, tone: ok ? '' : 'bad' }); }
      else { T(o, [675, 330, 74], ok ? '1059 · 64,00' : '1059 · 49,00 · frete 0,00', ok ? 'acc' : 'bad'); if (!ok) o.on.db = 'bad'; } }
    // os dois ambientes do blue/green
    if (sc === 'bluegreen' && o.pods.length && cur().id !== 'frio') {
      if (o.pods[1]) T(o, [PC(1), PY + 12, 54], 'blue · 2.4.0', 'hi'); T(o, [PC(4), PY + 12, 54], 'green · 2.5.0', 'acc'); }
  }
  function spec() { const o = base(); cur().f(o, lt); finish(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, papel à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(14)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, 12, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(14)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : lit_ ? accC() : C.inkHi;
    if (d.mini) { x.textAlign = 'center'; x.fillStyle = col; fitFont(x, u, d.name, 9, W_ - 3); x.fillText(d.name, u(W_ / 2), u(H_ / 2 - (d.bar != null ? 6 : 0)));
      if (d.bar != null) { x.fillStyle = C.line; x.fillRect(u(2), u(H_ - 10), u(W_ - 4), u(5)); x.fillStyle = accC(); x.fillRect(u(2), u(H_ - 10), u((W_ - 4) * d.bar), u(5)); }
      cv.tex.needsUpdate = true; return; }
    const small = H_ < 80, big = d.pod ? 27 : small ? 17 : 23;
    head(x, u, d, W_, col, big); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(25)); x.lineTo(u(W_ - 4), u(27)); x.stroke();
    let y = small ? 39 : 44; for (const [text, tn] of d.rows || []) { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, small ? 14 : 18, W_ - 10); x.fillText(text, u(5), u(y)); } y += small ? 17 : 22; }
    if (d.bar != null) { x.fillStyle = C.line; x.fillRect(u(5), u(H_ - 13), u(W_ - 10), u(6)); x.fillStyle = accC(); x.fillRect(u(5), u(H_ - 13), u((W_ - 10) * d.bar), u(6)); }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = codeOf(s);
    const key = JSON.stringify([o.cnt, o.res, yl, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl((s.yk || 'A CONTA').toUpperCase(), L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const RAIO = [['recreate', 'Recreate', '0 → 100% de uma vez', 'ninguém', 'R$ 54.000 + 40 s fora'], ['rolling', 'Rolling', '0 → 33 → 67 → 100%', 'ninguém', 'R$ 54.000'],
    ['bluegreen', 'Blue/Green', 'virada de 0 a 100%', 'o teste, se tiver Recife', 'R$ 0 ou R$ 54.000'], ['canary', 'Canary', '10% por 5 min', 'a métrica de negócio', 'R$ 450']];
  const raio = hi => `<table class="h3-sum"><tr><th>modelo</th><th>na 2.5.0</th><th>quem percebe</th><th>perda</th></tr>${RAIO.map(r => `<tr${r[0] === hi ? ' class="on"' : ''}><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</table>`;
  const WAVES = [['0–30 s', '0%', '3 + 1 subindo'], ['30–60 s', '33%', '2 + 1 (+1 subindo)'], ['60–90 s', '67%', '1 + 2 (+1 subindo)'], ['90 s', '100%', '0 + 3']];
  const DATA = {
    rollback: () => `<li>Cenário (exemplo): terça, 14:00, <b>5 pedidos/s</b> (SP 55% · Rio 25% · Recife 20%); <code>pedidos</code> com 3 pods; pod pronto em <b>30 s</b></li><li>O defeito da 2.5.0: faixa de CEP 50000–52999 fora da tabela nova → <code>frete 0,00</code>, <code>201</code>, 0% de erros; 1059 da Lena: <b>64,00 → 49,00</b></li><li>Recife: 1 pedido/s × 3.600 s = <b>3.600</b> pedidos × 15,00 = <b>R$ 54.000</b>; às 23:00: R$ 486.000</li><table class="h3-sum"><tr><th>modelo</th><th>tempo para voltar</th></tr><tr><td>Recreate</td><td>40 s, fora do ar</td></tr><tr class="on"><td>Rolling (undo)</td><td>90 s</td></tr><tr><td>Blue/Green</td><td>~1 s com o blue de pé; ~30 s se já saiu</td></tr><tr><td>Canary</td><td>segundos (peso 0)</td></tr><tr><td>Flag</td><td>≤ 30 s (TTL do cache)</td></tr><tr><td>O dado</td><td>não volta</td></tr></table><li>Kubernetes: <code>kubectl rollout undo</code>, <code>revisionHistoryLimit</code> 10 por padrão (0 = sem volta), <code>progressDeadlineSeconds</code></li>`,
    recreate: () => `<li>Kubernetes, <code>strategy.type: Recreate</code>: todos os pods antigos são encerrados antes de criar os novos</li><li>Fora do ar: 10 s (encerrar) + 30 s (pronto) = <b>40 s</b>; 200 recusados a 5/s, <b>1.200</b> a 30/s</li><li>E se a 2.5.0 não sobe (<code>column "frete" does not exist</code>): 40 + 40 = <b>80 s</b>, 400 a 5/s, <b>2.400</b> a 30/s</li><li>Kafka (<code>entregas</code>, 3 partições, 6 s por rebalance, exemplo): rolling 3 × 2 × 6 = <b>36 s</b>; recreate 1 × 6 s</li><li>Correções ao artigo: o critério é as versões não poderem coexistir (assincronia não é pré-requisito); KIP-429 e <code>group.instance.id</code> tornam o recreate opcional para consumidores Kafka</li>${raio('recreate')}`,
    rolling: () => { const on = { onda1: 0, onda2: 1, onda3: 2 }[cur().id]; const hi = cur().id === 'passa' ? 3 : on;
      return `<li>Kubernetes: <code>maxSurge</code> e <code>maxUnavailable</code> 25% por padrão; surge arredonda <b>para cima</b>, unavailable <b>para baixo</b></li><table class="h3-sum"><tr><th>janela</th><th>% na 2.5.0</th><th>pods 2.4.0 + 2.5.0</th></tr>${WAVES.map((r, i) => `<tr${i === hi ? ' class="on"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table><li><code>catalogo</code>, 10 pods: surge 3, unavailable 2 → mínimo 8 → 640 req/s a <b>80%</b>, 60 ms; unavailable 3 → 7 pods, <b>91,4%</b>, 126,7 ms</li><li>Portões de saúde: <code>readinessProbe</code>, <code>minReadySeconds</code>, <code>progressDeadlineSeconds</code>, <code>kubectl rollout pause</code>; nenhum mede o frete</li>${raio('rolling')}`; },
    bluegreen: () => `<li>Blue = 2.4.0 (3 pods), green = 2.5.0 (3 pods); banco único; <code>catalogo</code> na Black Friday: 10 + 10 = 10 réplica-horas a mais por hora</li><li>Green frio (exemplo): 200 ms × 640 req/s = <b>128</b> em voo (quente: 12,8); 10 pods × 10 workers = <b>100</b>; CPU 64%</li><li>Lab (<code>blue-green/simple</code> e <code>automated</code>): 5 réplicas, <code>activeService: chip</code>, <code>previewService: chip-green</code>, <code>autoPromotionEnabled: false</code>, <code>scaleDownDelaySeconds: 60</code>; <code>cassowary -c 3 -n 1000</code> e <code>result[0] >= 0.95</code> antes da promoção (não executado aqui: só roda no cluster do autor)</li><li>Argo Rollouts: <code>scaleDownDelaySeconds</code> é <b>30 s</b> por padrão</li>${raio('bluegreen')}`,
    canary: () => `<li>Plano da loja: 0% (cabeçalho <code>x-versao: v2</code>) → 10% → 50% → 100%, 5 min por degrau; análise técnica (5xx ≤ 0,1%, p95 ≤ 800 ms) <b>e</b> de negócio (<code>pedidos_frete_zero{cidade}</code> = 0)</li><li>10% × 5/s × 300 s = <b>150</b> pedidos, <b>30</b> de Recife, <b>R$ 450</b>; no degrau de 50%: 750, 150, R$ 2.250</li><li>Amostra: 0,99<sup>150</sup> = <b>22%</b>; ln(0,05) ÷ ln(0,99) = <b>298</b> requisições (10 min a 0,5/s; 4,7 s a 64/s); 2% de erro: 148; 5%: 58</li><li>Lab: <code>initial</code>/<code>simple</code> 0 → 10 → 20 → 40 → 80 → 100 com <code>pause: {}</code>; <code>time</code> com <code>duration: 10s</code> (50 s); <code>analysis</code> 20 → 50 → 100 (não executado aqui); a consulta de negócio da loja é adaptação, não executada</li>${raio('canary')}`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function actHtml() { const k = cur().act; if (!k) return ''; const A = ACTS[k];
    return `<div class="o3-mode r3-act" role="group" aria-label="${A.label}">${A.opts.map(([lab, sm], i) => `<button data-act3="${k}" data-v="${i}" aria-pressed="${i === actv[k]}">${lab}<small>${sm}</small></button>`).join('')}</div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(codeOf(s).join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'rollout') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'rollout' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-rollout3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'rollout') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const p = e.target.closest('[data-act3]'); if (p) { actv[p.dataset.act3] = +p.dataset.v; lt = 0; render(); SFX.bit(1); } });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && Bk.w > 60 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn, big]) => dot(p, tn, big));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }
  const badEm = new THREE.Color(0xe0180c);

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [24, 790, 20, 440];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.9 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.76 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, kf = nar ? 1.16 : 1.05, D = Math.max(span * 0.707 / 100 * kf / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * kf / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C0 = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C0.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), Pp = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(Pp, k);
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(200, 230, 60), dist: 17 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
