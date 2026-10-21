// Figura 3D (iso-glow): o banco do pedidos em três sites. SP (pg-sp, o primário) à esquerda; Rio (pg-rio) e Recife (pg-recife)
// à direita, ligados a SP por cabos com o RTT escrito (10 e 80 ms). Na face de cada gabinete, a fita do WAL: cada célula é um
// registro (o 1055 da Lena e os vizinhos); acesa = aplicada, contorno = recebida e ainda não aplicada, vermelha = perdida.
// O registro que viaja é um ponto de luz com o rótulo em cima. Ao lado de Recife, o celular da Lena com "meus pedidos".
// Atrás, o mostrador (contadores, o SQL ou a conta do passo e o resultado).
// Cenários (botões e ?mode=primary-replica|queda|multi|lag|assincrona|semi|sincrona; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/replicacao-brief.md) e as aulas 1–3 (commit 2/12/82 ms; 9 e 24 pedidos;
// RTO 35 s = 1.050 compras; LSN 0/8004430 × 0/8000060 do laboratório em PostgreSQL 14).
FIGS3D.push({ id: 'replicas', name: 'Réplicas', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
  const hms = ms => '20:10:00.' + String(Math.max(0, Math.round(ms))).padStart(3, '0');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['primary-replica', 'queda', 'multi', 'lag', 'assincrona', 'semi', 'sincrona'];
  const SCNAME = { 'primary-replica': 'Réplicas', queda: 'Queda', multi: 'Primary/​Primary', lag: 'Atraso', assincrona: 'Assíncrona', semi: 'Semi', sincrona: 'Síncrona' };
  const SCFULL = { 'primary-replica': 'Primário e réplicas', queda: 'A queda do primário', multi: 'Primary/Primary', lag: 'A Lena e o atraso',
    assincrona: 'Replicação assíncrona', semi: 'Replicação semi-síncrona', sincrona: 'Replicação síncrona' };
  const A1 = 'aula-1-introducao', A2 = 'aula-2-modelos-primary-primary-e-primary-replica', A3 = 'aula-3-sincrona-assincrona-semi-sincrona-e-por-logs';
  const AULA = { 'primary-replica': A1, queda: A2, multi: A2, lag: A3, assincrona: A3, semi: A3, sincrona: A3 };
  let clk = 0, sc = 'primary-replica', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', paused = false;
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-replicas3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda (o Rio fica na frente da metade direita da prancha)
  const SZ = PL + 46, SW = 500, SH = SW * 143 / 416;
  rbox(24, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SW - 6, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // gabinetes: SP maior (o primário), Rio e Recife, o celular da Lena e (só no split brain) os clientes que ainda alcançam SP
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  block('sp', 40, 160, 270, 188, 34); block('rio', 540, 66, 220, 144, 28); block('rec', 540, 272, 220, 144, 28);
  block('lena', 772, 280, 122, 132, 14); block('cli', 60, 372, 230, 58, 14);
  const NAMES = Object.keys(B);
  // os pedidos sem primário: cartões empilhados na frente de SP
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz: os registros do WAL, os acks e as leituras
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 28 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
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
  const TAGS = Array.from({ length: 7 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const TF = x => [x, 430, 22];   // balão na faixa livre da frente da prancha

  // ── cabos ──
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], z]);
  const rev = pts => pts.slice().reverse();
  const CAB = { rio: P3([[310, 214], [425, 214], [425, 138], [540, 138]]), rec: P3([[310, 296], [425, 296], [425, 344], [540, 344]]),
    rr: P3([[650, 210], [650, 272]]), lena: P3([[760, 344], [772, 344]]), cli: P3([[175, 372], [175, 348]]) };
  const LENA_SP = [...rev(CAB.lena), ...rev(CAB.rec)];
  // um registro (ou ack, ou leitura) andando num cabo: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão dos gabinetes ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const W55 = (s55, s54 = 'ok') => [['1053', 'ok'], ['1054', s54], ['1055', s55]];
  // a fita da Black Friday: 10 células de 100 ms; as k últimas ainda não aplicadas (ou perdidas)
  const BF = (k, st = 'recv') => Array.from({ length: 10 }, (_, i) => ['', i >= 10 - k ? st : 'ok']);
  function base() {
    const o = { show: { sp: 1, rio: 1, rec: 1, lena: 1 }, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [] };
    o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['SP · lê e escreve', 'dim']); o.rows.sp.tape = W55('none');
    o.rows.rio = act('pg-rio', 'RÉPLICA', ['Rio · só lê', 'dim']); o.rows.rio.tape = W55('none');
    o.rows.rec = act('pg-recife', 'RÉPLICA', ['Recife · só lê', 'dim']); o.rows.rec.tape = W55('none');
    o.rows.lena = act('Lena', 'app', ['meus pedidos', 'dim'], ['1054 · 20:08', 'hi']);
    o.rows.cli = act('CLIENTES', 'que ainda alcançam SP', ['continuam comprando', 'dim']);
    o.beams.push({ pts: CAB.rio }, { pts: CAB.rec });
    o.rtt = 1;
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  // o 1055 sai de SP em s0 e chega à réplica depois de metade do RTT; aplica em a (ms do relógio da cena)
  const travel = (ms, s0, ow) => (ms - s0) / ow;
  const tapeAt = (ms, arrive, apply) => ms < arrive ? 'none' : ms < apply ? 'recv' : 'ok';

  // ── o que se vê em cada passo ──
  const STEPS = {
    'primary-replica': [
      { id: 'tres', dur: 5, title: 'Um primário e duas réplicas', yk: 'A TOPOLOGIA', act: ['write', 'Escrever o 1055 em SP'],
        code: ['pg-sp      primário · lê e escreve', 'pg-rio     réplica  · só lê', 'pg-recife  réplica  · só lê', 'RTT SP–Rio 10 ms · SP–Recife 80 ms', 'Lena lê de Recife: ~2 ms, não 80'],
        story: 'Cada shard do <code>pedidos</code> agora tem três cópias. O primário fica em SP (<code>pg-sp</code>): lê e escreve. As réplicas ficam no Rio (<code>pg-rio</code>) e em Recife (<code>pg-recife</code>) e só leem. As distâncias são exemplos: 10 ms de ida e volta até o Rio e 80 ms até Recife.',
        look: 'Os três gabinetes e os dois cabos com o RTT escrito. Na face de cada um, a fita do WAL termina no 1054, o último pedido da Lena (20:08).',
        key: 'Replicar é ter o mesmo dado em mais de um lugar.',
        f(o, t) { lit(o, 'sp');
          o.cnt = [['CÓPIAS', '3'], ['RTT RIO', '10 ms', 'dim'], ['RTT RECIFE', '80 ms', 'dim']];
          o.res = [['1 primário escreve, 2 réplicas leem', 'acc']]; } },
      { id: 'escreve', dur: 5, title: 'O 1055 entra em SP: commit em 2 ms', yk: 'NO PRIMÁRIO',
        code: ['INSERT INTO pedidos (id, cliente_id, total)', "  VALUES (1055, 'lena-77', 34.90);", 'COMMIT;  -- WAL no disco: 2 ms', 'SELECT pg_current_wal_lsn();  -- 0/8004430'],
        story: 'Às 20:10:00.000 a Lena compra 1 caneca azul: 19,90 mais 15,00 de frete, <b>34,90</b>. O <code>INSERT</code> chega ao primário, que grava o registro no WAL (o log de escrita antecipada) e confirma o commit em <b>2 ms</b>. A posição desse registro no log é o LSN <code>0/8004430</code>.',
        look: 'A célula 1055 acende na fita de SP. Nas réplicas ela ainda está vazia.',
        key: 'O primário grava primeiro no próprio log; o log é o que vai para as réplicas.',
        f(o, t) { const ms = lin(t, 0.6, 2.4, 0, 2); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['INSERT 1055 · 34,90', 'acc'], [ms >= 2 ? 'COMMIT em 2 ms' : 'gravando o WAL…', ms >= 2 ? 'acc' : 'dim'], ms >= 2 ? ['LSN 0/8004430', 'dim'] : null);
          o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          o.cnt = [['RELÓGIO', hms(ms)], ['COMMIT LOCAL', '2 ms', 'dim'], ['LSN', '0/8004430', 'dim']];
          o.res = ms >= 2 ? [['pronto em SP: 2 ms', 'acc']] : []; } },
      { id: 'fita', dur: 7, title: 'A fita chega ao Rio em 5 ms e a Recife em 40 ms', yk: 'METADE DO RTT, MAIS APLICAR',
        code: ['Rio:    10 ÷ 2 = 5 ms de ida', 'Recife: 80 ÷ 2 = 40 ms de ida', 'cada réplica aplica o log na ordem', 'dia comum: Rio 15 ms, Recife 60 ms atrás', '(40 de ida + 20 para aplicar)'],
        story: 'Depois do commit o registro sai de SP pelos dois cabos. Leva metade do RTT para chegar: <b>5 ms</b> ao Rio e <b>40 ms</b> a Recife. Cada réplica recebe o registro e o aplica, na ordem do log. Num dia comum o Rio fica 15 ms atrás e Recife 60 ms (40 de ida e 20 para aplicar). O relógio da figura conta a partir do commit.',
        look: 'O ponto de luz chega ao Rio quase de imediato e demora oito vezes mais no cabo de Recife. Na fita de cada réplica a célula 1055 aparece em contorno (recebida) e depois acende (aplicada).',
        key: 'A réplica recebe o log, não a linha, e fica para trás o tempo da viagem mais o de aplicar.',
        f(o, t) { const ms = lin(t, 0.5, 5, 0, 70); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 confirmado', 'acc'], ['envia o WAL às réplicas', 'dim']); o.rows.sp.tape = W55('ok');
          const rio = tapeAt(ms, 5, 15), rec = tapeAt(ms, 40, 60);
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['Rio · só lê', 'dim'], [rio === 'none' ? 'esperando' : rio === 'recv' ? 'recebido: aplicando' : 'aplicado em 15 ms', rio === 'ok' ? 'acc' : 'dim']); o.rows.rio.tape = W55(rio);
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['Recife · só lê', 'dim'], [rec === 'none' ? 'o WAL está no cabo' : rec === 'recv' ? 'recebido: aplicando' : 'aplicado em 60 ms', rec === 'ok' ? 'acc' : 'dim']); o.rows.rec.tape = W55(rec);
          if (rio === 'ok') o.on.rio = 1; if (rec === 'ok') o.on.rec = 1;
          o.beams = [{ pts: CAB.rio, on: ms < 5 }, { pts: CAB.rec, on: ms < 40 }];
          pk(o, CAB.rio, travel(ms, 0, 5), 'WAL 1055'); pk(o, CAB.rec, travel(ms, 0, 40), 'WAL 1055');
          o.cnt = [['DEPOIS DO COMMIT', '+' + Math.round(ms) + ' ms'], ['NO RIO', rio === 'ok' ? 'aplicado' : rio === 'recv' ? 'recebido' : '…', 'dim'], ['EM RECIFE', rec === 'ok' ? 'aplicado' : rec === 'recv' ? 'recebido' : '…', 'dim']];
          o.res = rec === 'ok' ? [['as três cópias têm o 1055', 'acc']] : []; } },
      { id: 'perto', dur: 5, title: 'A Lena lê de Recife em ~2 ms', yk: 'LER PERTO',
        code: ["SELECT id, total FROM pedidos", " WHERE cliente_id = 'lena-77'", " ORDER BY id DESC LIMIT 1;", '-- em pg-recife: ~2 ms', '-- em pg-sp: + 80 ms de ida e volta'],
        story: 'A Lena abre "meus pedidos". A leitura vai à réplica de Recife, na mesma cidade: cerca de <b>2 ms</b>, em vez de pagar <b>80 ms</b> de ida e volta até SP. As réplicas também dividem as leituras: o primário fica com as escritas.',
        look: 'A luz corre no cabo curto entre Recife e o celular. A tela da Lena mostra o 1055, 34,90.',
        key: 'Uma réplica perto de quem lê troca 80 ms por 2 ms.',
        f(o, t) { lit(o, 'rec', 'lena'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok'); o.rows.rec.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['atende a Lena', 'acc'], ['leitura em ~2 ms', 'dim']); o.rows.rec.tape = W55('ok');
          o.rows.lena = act('Lena', 'app', ['meus pedidos', 'dim'], ['1055 · 34,90', 'acc'], ['1054 · 20:08', 'dim']);
          o.beams.push({ pts: CAB.lena, on: true, flow: true });
          o.cnt = [['LEITURA EM RECIFE', '~2 ms'], ['SE FOSSE EM SP', '80 ms', 'dim'], ['NA TELA', '1055', 'dim']];
          o.res = [['leitura perto: 2 ms', 'acc']]; } },
      { id: 'so-le', dur: 6, title: 'A réplica só lê: o INSERT falha', yk: 'EM pg-recife (PORTA 55434)',
        code: ["INSERT INTO pedidos … ;", 'ERROR:  cannot execute INSERT', '        in a read-only transaction', 'SHOW transaction_read_only;  -- on', 'SELECT pg_is_in_recovery();  -- t'],
        story: 'E se alguém tentar escrever direto na réplica? No laboratório do SDLabs, um <code>INSERT INTO pedidos …</code> na porta 55434 devolve <code>ERROR: cannot execute INSERT in a read-only transaction</code>. A réplica está em recuperação (<code>pg_is_in_recovery()</code> = <code>t</code>): só aplica o log que vem do primário.',
        look: 'O gabinete de Recife fica vermelho e o balão mostra o erro. A fita continua igual.',
        key: 'No Primary/Replica só o primário escreve.',
        f(o, t) { o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok'); const err = t > 1;
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['INSERT INTO pedidos …', 'hi'], err ? ['ERROR: read-only', 'bad'] : null, err ? ['transaction_read_only = on', 'dim'] : null); o.rows.rec.tape = W55('ok');
          o.on.rec = err ? 'bad' : 1;
          o.cnt = [['INSERT NA RÉPLICA', err ? 'recusado' : '…', err ? 'bad' : ''], ['read_only', 'on', 'dim'], ['in_recovery', 't', 'dim']];
          o.res = err ? [['cannot execute INSERT in a', 'bad'], ['read-only transaction', 'bad']] : [];
          if (err) T(o, [650, 262, 52], 'ERROR: read-only', 'bad'); } },
      { id: 'erro', dur: 7, title: 'E se der errado: réplica não é backup', yk: 'ÀS 20:15, NO PRIMÁRIO',
        code: ["DELETE FROM pedidos WHERE status = 'criado';", '-- sem olhar o WHERE', 'o WAL leva o DELETE ao Rio e a Recife', 'em 60 ms (o atraso normal de Recife)', 'três cópias do erro'],
        story: 'Às 20:15 alguém roda <code>DELETE FROM pedidos WHERE status = \'criado\'</code> sem olhar o <code>WHERE</code>. O primário apaga, o log leva o apagamento pelos mesmos cabos e em <b>60 ms</b> (o atraso normal de Recife) as três cópias estão sem os pedidos. Para voltar a um ponto no tempo é preciso backup, assunto do módulo 27.',
        look: 'A célula vermelha do DELETE entra na fita de SP e viaja pelos dois cabos até as réplicas, que ficam vermelhas.',
        key: 'Replicação copia o dado e copia o erro.',
        f(o, t) { const ms = lin(t, 0.8, 5.2, 0, 70), DEL = s => [['1054', 'ok'], ['1055', 'ok'], ['DELETE', s]];
          const rio = tapeAt(ms, 5, 15), rec = tapeAt(ms, 40, 60), bad = s => s === 'ok' ? 'bad' : s;
          o.on.sp = 'bad'; o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['DELETE … status = criado', 'bad'], ['pedidos apagados', 'bad']); o.rows.sp.tape = DEL('bad');
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['Rio · só lê', 'dim'], rio === 'ok' ? ['apagou também', 'bad'] : null); o.rows.rio.tape = DEL(bad(rio));
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['Recife · só lê', 'dim'], rec === 'ok' ? ['apagou também', 'bad'] : null); o.rows.rec.tape = DEL(bad(rec));
          if (rio === 'ok') o.on.rio = 'bad'; if (rec === 'ok') o.on.rec = 'bad';
          o.beams = [{ pts: CAB.rio, on: ms < 5, tone: 'bad' }, { pts: CAB.rec, on: ms < 40, tone: 'bad' }];
          pk(o, CAB.rio, travel(ms, 0, 5), 'DELETE', 'bad'); pk(o, CAB.rec, travel(ms, 0, 40), 'DELETE', 'bad');
          const n = 1 + (rio === 'ok') + (rec === 'ok');
          o.cnt = [['CÓPIAS DO ERRO', String(n), 'bad'], ['DEPOIS DO DELETE', '+' + Math.round(ms) + ' ms', 'dim'], ['BACKUP', 'módulo 27', 'dim']];
          o.res = n === 3 ? [['as três cópias sem os pedidos', 'bad']] : [];
          if (n === 3) T(o, TF(650), 'réplica não é backup', 'bad'); } },
    ],
    queda: [
      { id: 'bf', dur: 6, title: 'Black Friday: o Rio 300 ms atrás, Recife 800 ms', yk: 'O QUE AINDA NÃO CHEGOU',
        code: ['30 pedidos/s · replicação assíncrona', 'Rio    300 ms atrás: 30 × 0,3 = 9', 'Recife 800 ms atrás: 30 × 0,8 = 24', 'confirmados em SP, ainda não', 'aplicados na réplica'],
        story: 'Na Black Friday chegam <b>30 pedidos por segundo</b>, e a replicação é assíncrona: SP confirma e manda o log depois. Aplicar fica mais lento que gerar, e as réplicas ficam para trás: o Rio <b>300 ms</b>, Recife <b>800 ms</b>. Nesse atraso cabem 30 × 0,3 = <b>9</b> pedidos no Rio e 30 × 0,8 = <b>24</b> em Recife.',
        look: 'Cada célula da fita é 100 ms de log. Na fita do Rio, as 3 últimas estão em contorno (recebidas e não aplicadas); na de Recife, 8.',
        key: 'Com replicação assíncrona, a réplica está sempre um pouco atrás do primário.',
        f(o, t) { lit(o, 'sp'); o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['30 pedidos/s', 'acc'], ['commit em 2 ms', 'dim']); o.rows.sp.tape = BF(0);
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['300 ms atrás', 'acc'], ['= 9 pedidos', 'dim']); o.rows.rio.tape = BF(3);
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['800 ms atrás', 'acc'], ['= 24 pedidos', 'dim']); o.rows.rec.tape = BF(8);
          o.beams = [{ pts: CAB.rio, on: true, flow: true }, { pts: CAB.rec, on: true, flow: true }];
          o.cnt = [['TAXA', '30 pedidos/s'], ['ATRÁS NO RIO', '9 pedidos', 'dim'], ['ATRÁS EM RECIFE', '24 pedidos', 'dim']];
          o.res = [['o atraso é a janela de perda', 'acc']]; } },
      { id: 'cai', dur: 6, title: 'SP apaga: 9 pedidos não chegaram ao Rio, 24 a Recife', yk: 'O PRIMÁRIO PARA',
        code: ['pg_ctl -D primary -m immediate stop', 'Rio:    falta o que estava nos 300 ms → 9', 'Recife: falta o que estava nos 800 ms → 24', 'RPO (assíncrona) = taxa × atraso', 'dia comum: 5/s × 0,06 s ≈ 0,3'],
        story: 'O primário de SP cai de repente. O que já estava aplicado nas réplicas está salvo. O que estava no atraso some: se o Rio for promovido, <b>9 pedidos</b> que a loja confirmou deixam de existir; se fosse Recife, <b>24</b>. Num dia comum a mesma conta dá 0,3, praticamente zero.',
        look: 'SP fica vermelho e os cabos apagam. As células em contorno viram vermelhas: são os pedidos perdidos.',
        key: 'RPO é quanto dado se perde: na assíncrona, taxa × atraso.',
        f(o, t) { const down = t > 0.6; o.on.sp = down ? 'bad' : 1;
          o.rows.sp = act('pg-sp', down ? 'FORA DO AR' : 'PRIMÁRIO', [down ? 'parado (-m immediate)' : '30 pedidos/s', down ? 'bad' : 'acc']); o.rows.sp.tape = BF(0, 'ok');
          o.rows.rio = act('pg-rio', 'RÉPLICA', [down ? 'perdeu 9 pedidos' : '300 ms atrás', down ? 'bad' : 'acc']); o.rows.rio.tape = BF(3, down ? 'bad' : 'recv');
          o.rows.rec = act('pg-recife', 'RÉPLICA', [down ? 'perdeu 24 pedidos' : '800 ms atrás', down ? 'bad' : 'acc']); o.rows.rec.tape = BF(8, down ? 'bad' : 'recv');
          o.beams = [{ pts: CAB.rio, tone: down ? 'bad' : '', on: !down, flow: true }, { pts: CAB.rec, tone: down ? 'bad' : '', on: !down, flow: true }];
          o.cnt = [['PERDIDOS SE O RIO', down ? '9' : '…', 'bad'], ['SE RECIFE', down ? '24' : '…', 'bad'], ['PRIMÁRIO', down ? 'nenhum' : 'SP', down ? 'bad' : 'dim']];
          o.res = down ? [['9 (Rio) ou 24 (Recife) pedidos', 'bad'], ['confirmados e perdidos', 'bad']] : [];
          if (down) T(o, TF(175), 'SP fora do ar', 'bad'); } },
      { id: 'eleicao', dur: 8, title: 'Quem vira líder: o Rio, mais à frente no log', yk: 'A ELEIÇÃO',
        code: ['Patroni: ttl 30 s sem renovar → failover', 'candidatas: Rio (300 ms), Recife (800 ms)', 'Raft: voto só para log igual ou mais novo', 'espera sorteada entre 150 e 300 ms', 'quórum: 2 de 3 → o Rio'],
        story: 'Ninguém promove a réplica no instante da queda. O Patroni espera o líder deixar de renovar a chave: o padrão é <code>ttl: 30</code> segundos. Aí escolhe a réplica <b>mais à frente no log</b>: o Rio, com 300 ms de atraso, vence Recife, com 800. No Raft a regra é a mesma: o voto só vai para quem tem o log igual ou mais atualizado, e a escolha precisa de quórum, <b>2 de 3</b>. Enquanto isso, as compras chegam e não têm onde gravar.',
        look: 'O relógio da queda corre até 30 s e a pilha de compras sem primário cresce na frente de SP. Recife manda o voto ao Rio pelo cabo do meio.',
        key: 'A promoção escolhe a réplica com o log mais à frente, com quórum.',
        f(o, t) { const s = lin(t, 0.3, 5.3, 0, 30); o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', 'FORA DO AR', ['sem renovar a chave', 'bad'], [`há ${Math.round(s)} s`, 'dim']); o.rows.sp.tape = BF(0, 'ok');
          o.rows.rio = act('pg-rio', 'CANDIDATA', ['log à frente: 300 ms', 'acc'], [s >= 30 ? 'votos: 2 de 3' : 'aguarda o ttl', s >= 30 ? 'acc' : 'dim']); o.rows.rio.tape = BF(3, 'bad');
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['log atrás: 800 ms', 'dim'], [s >= 30 ? 'vota no Rio' : 'aguarda o ttl', 'dim']); o.rows.rec.tape = BF(8, 'bad');
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: s >= 30 }];
          if (s >= 30) pk(o, rev(CAB.rr), (lt * 0.6) % 1, 'voto');
          o.piles.push({ p: [175, 392, PL + 2], v: 30 * s, f: s / 35 });
          o.cnt = [['SEM PRIMÁRIO', `${Math.round(s)} s`, 'bad'], ['COMPRAS SEM PRIMÁRIO', thou(30 * s), 'bad'], ['QUÓRUM', s >= 30 ? '2 de 3: Rio' : '…', 'dim']];
          o.res = s >= 30 ? [['o Rio vence: log mais à frente', 'acc']] : [['esperando o ttl de 30 s', 'dim']]; } },
      { id: 'promove', dur: 7, title: 'pg_ctl promote: o Rio vira primário, linha do tempo 1 → 2', yk: 'A PROMOÇÃO',
        code: ['pg_ctl -D rio promote', 'SELECT pg_is_in_recovery();  -- f', "pg_controldata: Latest checkpoint's TimeLineID: 2", 'RTO = 30 s (ttl) + ~5 s = 35 s', '30 pedidos/s × 35 s = 1.050 tentativas'],
        story: 'O Rio é promovido: <code>pg_is_in_recovery()</code> passa a <code>f</code> e a <b>linha do tempo</b> vai de 1 para <b>2</b>. Com uns 5 s para promover e reconectar, a loja ficou <b>35 s</b> sem primário (o RTO): 30 × 35 = <b>1.050</b> tentativas de compra. Recife passa a seguir o Rio. O primário antigo só volta como réplica depois de um <code>pg_rewind</code>.',
        look: 'O Rio acende como primário e o cabo do meio leva o log do Rio a Recife. A pilha para em 1.050.',
        key: 'RTO é quanto tempo a loja fica sem escrever; aqui, 35 s.',
        f(o, t) { const s = lin(t, 0.3, 2.8, 30, 35), up = s >= 35; o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', 'FORA DO AR', ['volta só com pg_rewind', 'dim']); o.rows.sp.tape = BF(0, 'ok');
          o.rows.rio = act('pg-rio', up ? 'PRIMÁRIO' : 'PROMOVENDO', [up ? 'lê e escreve' : 'pg_ctl promote', 'acc'], [up ? 'linha do tempo 2' : 'linha do tempo 1', up ? 'acc' : 'dim']); o.rows.rio.tape = BF(3, 'bad');
          o.rows.rec = act('pg-recife', 'RÉPLICA', [up ? 'segue o Rio' : 'aguarda', 'dim'], ['linha do tempo ' + (up ? 2 : 1), 'dim']); o.rows.rec.tape = BF(8, 'bad');
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: up, flow: true }];
          o.piles.push({ p: [175, 392, PL + 2], v: 30 * s, f: s / 35 });
          o.cnt = [['RTO', `${Math.round(s)} s`, up ? '' : 'bad'], ['TENTATIVAS', thou(30 * s), 'bad'], ['LINHA DO TEMPO', up ? '1 → 2' : '1', 'dim']];
          o.res = up ? [['35 s e 1.050 compras sem primário', 'bad']] : [];
          if (up) T(o, [650, 60, 46], 'timeline 2', 'acc'); } },
      { id: 'split', dur: 7, title: 'E se der errado: SP isolada, mas viva', yk: 'SPLIT BRAIN',
        code: ['o cabo de SP cai; o pg-sp continua vivo', 'clientes que alcançam SP gravam em SP', 'o Rio foi promovido e grava também', 'dois primários: dois 1056 diferentes', 'a mesma caneca vendida duas vezes'],
        story: 'Agora o primário <b>não morreu</b>: só o cabo de SP caiu. O <code>pg-sp</code> continua aceitando escritas dos clientes que ainda o alcançam, e do outro lado o Rio foi promovido. São <b>duas verdades</b>: dois primários, dois pedidos 1056 diferentes, a mesma caneca vendida duas vezes. É o <i>split brain</i>.',
        look: 'Os cabos de SP ficam vermelhos e cortados. Os clientes, na frente, continuam gravando em SP, e o Rio também grava: os dois gabinetes mostram PRIMÁRIO.',
        key: 'Split brain: dois primários vivos aceitando escrita.',
        f(o, t) { const two = t > 1; o.show.cli = 1; o.on.cli = 2; o.on.sp = 'bad'; o.on.rio = two ? 'bad' : 1;
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['isolado, mas vivo', 'bad'], two ? ['grava o 1056 (SP)', 'bad'] : null); o.rows.sp.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', two ? 'bad' : 'none']];
          o.rows.rio = act('pg-rio', 'PRIMÁRIO', ['promovido: grava', 'acc'], two ? ['grava o 1056 (Rio)', 'bad'] : null); o.rows.rio.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', two ? 'bad' : 'none']];
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['segue o Rio', 'dim']); o.rows.rec.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', two ? 'recv' : 'none']];
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: true, flow: true }, { pts: CAB.cli, on: true, flow: true }];
          o.cnt = [['PRIMÁRIOS', two ? '2' : '…', 'bad'], ['PEDIDO 1056', two ? '2 diferentes' : '…', 'bad'], ['CABO DE SP', 'cortado', 'bad']];
          o.res = two ? [['duas verdades: split brain', 'bad']] : [];
          if (two) { T(o, [425, 255, 40], 'cabo cortado', 'bad'); T(o, TF(650), 'dois primários', 'bad'); } } },
      { id: 'cerca', dur: 8, title: 'A contenção: fencing e SyncRep', yk: 'COMO IMPEDIR DOIS PRIMÁRIOS',
        code: ['fencing: o Patroni derruba o líder que', '  não renova a chave em 30 s', 'síncrona: sem ack de nenhuma réplica,', '  o commit em SP espera:', '  wait_event = SyncRep'],
        story: 'Há duas contenções. A primeira é o <b>fencing</b>: o Patroni derruba o líder que não renova a chave em 30 s, e o primário isolado se desliga. A segunda é a <b>replicação síncrona</b>: sem o ack de nenhuma réplica, o commit em SP <b>espera</b> (<code>wait_event = SyncRep</code>), e o pedido nunca é confirmado a quem só alcança SP.',
        look: 'O commit dos clientes de SP fica parado em SyncRep; o relógio do fencing chega a 30 s e SP se desliga. Sobra um primário: o Rio.',
        key: 'Fencing e replicação síncrona impedem que o primário isolado continue confirmando.',
        f(o, t) { const s = lin(t, 0.6, 5, 0, 30), off = s >= 30; o.show.cli = 1; o.on.cli = off ? 0 : 2; o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', off ? 'DESLIGADO' : 'ISOLADO', [off ? 'fencing: derrubado' : 'commit esperando', 'bad'], [off ? 'não aceita escrita' : 'wait_event = SyncRep', 'dim']); o.rows.sp.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', 'recv']];
          o.rows.rio = act('pg-rio', 'PRIMÁRIO', ['o único que grava', 'acc']); o.rows.rio.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', 'ok']];
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['segue o Rio', 'dim']); o.rows.rec.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', 'ok']];
          o.rows.cli = act('CLIENTES', 'de SP', [off ? 'sem primário em SP' : 'esperando o commit', 'bad']);
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: true, flow: true }, { pts: CAB.cli, on: !off, tone: 'bad' }];
          o.cnt = [['FENCING', `${Math.round(s)} de 30 s`, off ? '' : 'dim'], ['COMMIT EM SP', off ? 'nenhum' : 'SyncRep', 'bad'], ['PRIMÁRIOS', off ? '1: o Rio' : '1 confirma', 'dim']];
          o.res = off ? [['um primário só: o Rio', 'acc']] : [['SP não confirma sem ack', 'acc']]; } },
    ],
    multi: [
      { id: 'dois', dur: 5, title: 'Primary/Primary: SP e Recife escrevem', yk: 'DOIS DONOS',
        code: ['SP     aceita escrita', 'Recife aceita escrita', 'cada um repassa ao outro', 'sem ponto único de falha', '… e com conflito de escrita'],
        story: 'No Primary/Primary, SP e Recife aceitam escrita, e cada um repassa ao outro o que gravou. Se um cai, o outro continua escrevendo: não há ponto único de falha. O Rio segue como réplica de SP. O preço aparece quando os dois mudam o mesmo dado ao mesmo tempo.',
        look: 'SP e Recife acesos como primários; a luz corre nos dois sentidos do cabo entre eles.',
        key: 'Vários escritores trocam o ponto único de falha por conflito.',
        f(o, t) { lit(o, 'sp', 'rec'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'PRIMÁRIO', ['Recife · lê e escreve', 'acc']); o.rows.rec.tape = W55('ok');
          o.beams = [{ pts: CAB.rio, on: true, flow: true }, { pts: CAB.rec, on: true, flow: true }, { pts: rev(CAB.rec), on: true, flow: true }];
          o.cnt = [['PRIMÁRIOS', '2'], ['RÉPLICAS', '1 (Rio)', 'dim'], ['PONTO ÚNICO', 'nenhum', 'dim']];
          o.res = [['dois escritores', 'acc']]; } },
      { id: 'endereco', dur: 7, title: 'O endereço da Lena, escrito nos dois ao mesmo tempo', yk: 'DUAS ESCRITAS',
        code: ['SP:     atendente → "Rua do Sol, 200"', '        carimbo 20:20:00.100', 'Recife: Lena no app → "Rua da Aurora, 100"', '        de verdade às 20:20:00.150', '        relógio −120 ms: carimbo .030'],
        story: 'Às 20:20 o atendente de SP muda o endereço da Lena para "Rua do Sol, 200", com carimbo <b>20:20:00.100</b>. Ao mesmo tempo, a Lena muda no app, em Recife, para "Rua da Aurora, 100". A escrita dela é a mais nova de verdade (20:20:00.150), mas o relógio de Recife está <b>120 ms atrasado</b> e carimba <b>20:20:00.030</b>.',
        look: 'Duas escritas cruzam o cabo em sentidos opostos, cada uma com o seu carimbo.',
        key: 'Dois escritores podem mudar o mesmo registro ao mesmo tempo.',
        f(o, t) { lit(o, 'sp', 'rec'); const f = lin(t, 1, 5, 0, 1);
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['Rua do Sol, 200', 'acc'], ['carimbo .100', 'dim']); o.rows.sp.tape = [['v SP', 'ok'], ['v Rec', f >= 1 ? 'recv' : 'none']];
          o.rows.rec = act('pg-recife', 'PRIMÁRIO', ['Rua da Aurora, 100', 'acc'], ['carimbo .030 (−120 ms)', 'bad']); o.rows.rec.tape = [['v Rec', 'ok'], ['v SP', f >= 1 ? 'recv' : 'none']];
          o.rows.lena = act('Lena', 'app', ['endereço', 'dim'], ['Rua da Aurora, 100', 'acc'], ['às .150 de verdade', 'dim']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true }, { pts: CAB.lena, on: true }];
          pk(o, CAB.rec, f, 'Rua do Sol · .100'); pk(o, rev(CAB.rec), f, 'Rua da Aurora · .030', 'bad');
          o.cnt = [['CARIMBO SP', '.100'], ['CARIMBO RECIFE', '.030', 'bad'], ['DE VERDADE', '.150 (Recife)', 'dim']];
          o.res = f >= 1 ? [['cada lado recebeu a do outro', 'acc']] : []; } },
      { id: 'lww', dur: 6, title: 'LWW: o carimbo .100 vence o .030', yk: 'LAST WRITE WINS',
        code: ['maior carimbo vence:', '  .100 (SP) > .030 (Recife)', '→ "Rua do Sol, 200" nos dois', 'a escrita mais nova (.150) se perdeu', 'LWW depende de relógio'],
        story: 'Com <i>last write wins</i> (LWW), cada site fica com o maior carimbo. Os dois chegam a "Rua do Sol, 200": convergiram. Só que a escrita mais nova de verdade era a da Lena, e ela sumiu sem erro. O LWW depende do relógio, e um relógio 120 ms atrasado decidiu o endereço da entrega.',
        look: 'Os dois gabinetes mostram Rua do Sol, 200. A escrita da Lena fica vermelha.',
        key: 'LWW converge, mas perde escritas e depende de relógio.',
        f(o, t) { lit(o, 'sp'); o.on.rec = t > 1 ? 1 : 0; const done = t > 1;
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['Rua do Sol, 200', 'acc'], ['.100 > .030: fica', 'dim']); o.rows.sp.tape = [['v SP', 'ok'], ['v Rec', 'bad']];
          o.rows.rec = act('pg-recife', 'PRIMÁRIO', [done ? 'Rua do Sol, 200' : 'Rua da Aurora, 100', done ? 'acc' : 'hi'], [done ? 'a da Lena perdeu' : 'comparando…', done ? 'bad' : 'dim']); o.rows.rec.tape = [['v Rec', done ? 'bad' : 'ok'], ['v SP', done ? 'ok' : 'recv']];
          o.rows.lena = act('Lena', 'app', ['endereço', 'dim'], [done ? 'Rua do Sol, 200' : 'Rua da Aurora, 100', done ? 'bad' : 'acc']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true }, { pts: CAB.lena, on: true }];
          o.cnt = [['VENCEU', 'Rua do Sol, 200'], ['PERDIDA', 'Rua da Aurora, 100', 'bad'], ['RELÓGIO RECIFE', '−120 ms', 'bad']];
          o.res = done ? [['convergiu e perdeu a escrita da Lena', 'bad']] : [];
          if (done) T(o, TF(650), 'perdeu a escrita mais nova', 'bad'); } },
      { id: 'vetor', dur: 6, title: 'Vetor de versão: as escritas são concorrentes', yk: 'NENHUM DOMINA',
        code: ['SP:     {SP:2, Rec:0}', 'Recife: {SP:1, Rec:1}', 'SP 2 > 1, mas Rec 0 < 1', '→ nenhum vetor domina o outro', '→ concorrentes: a aplicação decide'],
        story: 'Um <b>vetor de versão</b> guarda um contador por site. A escrita de SP leva <code>{SP:2, Rec:0}</code>; a de Recife, <code>{SP:1, Rec:1}</code>. SP está à frente num campo e atrás no outro: nenhum vetor domina, então as escritas são <b>concorrentes</b>. O banco guarda as duas e a aplicação decide, sem relógio.',
        look: 'Os dois gabinetes guardam as duas versões, em contorno, à espera de uma decisão.',
        key: 'O vetor de versão detecta a concorrência que o relógio esconde.',
        f(o, t) { lit(o, 'sp', 'rec'); const dt = t > 1.2;
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['{SP:2, Rec:0}', 'acc'], [dt ? 'concorrentes' : 'comparando…', dt ? 'acc' : 'dim']); o.rows.sp.tape = [['v SP', 'recv'], ['v Rec', 'recv']];
          o.rows.rec = act('pg-recife', 'PRIMÁRIO', ['{SP:1, Rec:1}', 'acc'], [dt ? 'concorrentes' : 'comparando…', dt ? 'acc' : 'dim']); o.rows.rec.tape = [['v Rec', 'recv'], ['v SP', 'recv']];
          o.rows.lena = act('Lena', 'app', ['endereço', 'dim'], ['qual dos dois?', 'acc']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true }, { pts: CAB.lena, on: true }];
          o.cnt = [['SP', '{SP:2, Rec:0}'], ['RECIFE', '{SP:1, Rec:1}', 'dim'], ['RESULTADO', dt ? 'concorrentes' : '…', 'dim']];
          o.res = dt ? [['detectou: a aplicação decide', 'acc']] : []; } },
      { id: 'colisao', dur: 7, title: 'E se der errado: os dois criam o pedido 1056', yk: 'A CHAVE PRIMÁRIA COLIDE',
        code: ['SP:     próximo número livre → 1056', 'Recife: próximo número livre → 1056', 'ao repassar: a chave primária colide', 'saídas: SP ímpares, Recife pares', '        ou UUID / ULID'],
        story: 'Cada site cria um pedido "novo" sem falar com o outro, e os dois dão o próximo número livre: <b>1056</b>. Quando um repassa ao outro, a chave primária colide. (A colisão é hipotética: o 1056 não é um pedido da história.) Saídas: faixas intercaladas, com SP usando os ímpares e Recife os pares, ou ids que não precisam de coordenação, como UUID e ULID.',
        look: 'Os dois 1056 cruzam o cabo e ficam vermelhos ao chegar.',
        key: 'Com dois escritores, até o número do pedido precisa de regra.',
        f(o, t) { const f = lin(t, 0.8, 4, 0, 1), hit = f >= 1; o.on.sp = hit ? 'bad' : 1; o.on.rec = hit ? 'bad' : 1;
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['cria o 1056', 'acc'], hit ? ['1056 já existe', 'bad'] : null); o.rows.sp.tape = [['1055', 'ok'], ['1056', hit ? 'bad' : 'ok']];
          o.rows.rec = act('pg-recife', 'PRIMÁRIO', ['cria o 1056', 'acc'], hit ? ['1056 já existe', 'bad'] : null); o.rows.rec.tape = [['1055', 'ok'], ['1056', hit ? 'bad' : 'ok']];
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true, tone: hit ? 'bad' : '' }];
          pk(o, CAB.rec, f, '1056 (SP)'); pk(o, rev(CAB.rec), f, '1056 (Recife)');
          o.cnt = [['PEDIDO 1056', hit ? '2 versões' : '…', 'bad'], ['CHAVE PRIMÁRIA', hit ? 'colide' : '…', 'bad'], ['SAÍDA', 'ímpar/par ou UUID', 'dim']];
          o.res = hit ? [['dois 1056: a chave colide', 'bad']] : [];
          if (hit) T(o, [425, 320, 44], 'chave primária colide', 'bad'); } },
    ],
    lag: [
      { id: 'pausa', dur: 5, title: 'Recife 800 ms atrás: pause o replay', yk: 'NO LABORATÓRIO, EM RECIFE', act: ['pause', 'Pausar o replay em Recife'],
        code: ['-- Black Friday: Recife 800 ms atrás', '-- no laboratório, o mesmo efeito:', 'SELECT pg_wal_replay_pause();', '-- recebe o WAL e não aplica'],
        story: 'Na Black Friday, Recife fica <b>800 ms</b> atrás do primário: o WAL chega em 40 ms, mas aplicar é mais lento que gerar. No laboratório do SDLabs o mesmo efeito se força à mão: <code>pg_wal_replay_pause()</code> na réplica de Recife. Ela continua <b>recebendo</b> o log e para de <b>aplicar</b>. Aperte o botão e avance.',
        look: 'O gabinete de Recife mostra o replay aplicando; com o botão, passa a PAUSADO.',
        key: 'Receber o log e aplicar o log são duas etapas diferentes.',
        f(o, t) { lit(o, 'sp'); o.rows.sp.tape = W55('none');
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['Recife · só lê', 'dim'], [paused ? 'replay: PAUSADO' : 'replay: aplicando', paused ? 'bad' : 'dim']); o.rows.rec.tape = W55('none');
          if (paused) o.on.rec = 'bad';
          o.cnt = [['REPLAY EM RECIFE', paused ? 'pausado' : 'aplicando', paused ? 'bad' : ''], ['ATRASO (BLACK FRIDAY)', '800 ms', 'dim'], ['IDA DO WAL', '40 ms', 'dim']];
          o.res = paused ? [['pg_wal_replay_pause(): recebe, não aplica', 'acc']] : [['aperte o botão no painel', 'dim']]; } },
      { id: 'commit', dur: 6, title: '20:10:00.002: SP confirma o 1055', yk: 'O TOKEN DO COMMIT',
        code: ['-- no primário, ao confirmar o 1055', 'SELECT pg_current_wal_lsn();  -- 0/8004430', 'commit às .002 (assíncrona: 2 ms)', 'o WAL chega a Recife às .042'],
        story: 'Às 20:10:00.000 a Lena fecha o pedido 1055 e o primário confirma às <b>.002</b>. A posição do commit no log, <code>0/8004430</code>, é o <b>token</b> desse pedido. O registro sai pelos cabos e chega a Recife às .042, mas lá ninguém o aplica.',
        look: 'O 1055 acende na fita de SP. Em Recife ele chega e fica em contorno: recebido, não aplicado.',
        key: 'O LSN do commit diz exatamente até onde a réplica precisa ter aplicado.',
        f(o, t) { const ms = lin(t, 0.4, 4.4, 0, 60); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 · 34,90', 'acc'], [ms >= 2 ? 'commit às .002' : 'gravando…', ms >= 2 ? 'acc' : 'dim'], ms >= 2 ? ['LSN 0/8004430', 'dim'] : null); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          const rio = ms < 7 ? 'none' : 'recv', rec = ms < 42 ? 'none' : 'recv';
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['300 ms atrás', 'dim']); o.rows.rio.tape = W55(rio);
          o.rows.rec = act('pg-recife', 'RÉPLICA', [rec === 'recv' ? 'recebeu o 1055' : 'Recife · só lê', 'dim'], [paused ? 'replay: PAUSADO' : '800 ms atrás', 'bad']); o.rows.rec.tape = W55(rec); o.on.rec = 'bad';
          o.beams = [{ pts: CAB.rio, on: ms < 7 }, { pts: CAB.rec, on: ms < 42 }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL 1055'); pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055');
          o.cnt = [['RELÓGIO', hms(ms)], ['TOKEN', '0/8004430', 'dim'], ['RECIFE', rec === 'recv' ? 'recebido' : '…', 'dim']];
          o.res = ms >= 2 ? [['a Lena já recebeu o "pronto"', 'acc']] : []; } },
      { id: 'lena', dur: 6, title: '20:10:00.300: a Lena não vê o 1055', yk: 'MEUS PEDIDOS, LIDO DE RECIFE',
        code: ["SELECT id, total FROM pedidos", " WHERE cliente_id = 'lena-77'", ' ORDER BY id DESC;', '-- em Recife: 1054 é o último', '-- o 1055 não aparece'],
        story: 'Às <b>20:10:00.300</b> a Lena toca em "meus pedidos". A tela lê da réplica de Recife, que ainda não aplicou o 1055, e mostra o <b>1054</b> (o de 20:08) como último pedido. Ela acabou de pagar e o pedido não está lá. Na Black Friday, sem pausa, ele só apareceria às 20:10:00.802. O nome técnico do que falta é <i>read-your-writes</i> (Vogels).',
        look: 'A leitura corre de Recife ao celular, e a tela mostra 1054. O 1055 continua em contorno na fita de Recife.',
        key: 'Com a réplica atrás, quem escreve pode não ver o que acabou de escrever.',
        f(o, t) { lit(o, 'sp', 'lena'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('recv'); o.on.rec = 'bad';
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['300 ms atrás', 'dim']); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['1055 recebido', 'dim'], ['1055 não aplicado', 'bad']); o.rows.rec.tape = W55('recv');
          const read = t > 1;
          o.rows.lena = act('Lena', 'app', ['meus pedidos', 'dim'], [read ? '1054 · 20:08' : 'carregando…', read ? 'hi' : 'dim'], read ? ['cadê o 1055?', 'bad'] : null);
          o.beams.push({ pts: CAB.lena, on: true, flow: true });
          o.cnt = [['RELÓGIO', '20:10:00.300'], ['ÚLTIMO NA TELA', read ? '1054' : '…', 'bad'], ['APARECE ÀS', paused ? 'retomar o replay' : '.802', 'dim']];
          o.res = read ? [['o 1055 não aparece', 'bad']] : [];
          if (read) T(o, [842, 270, 30], '1055?', 'bad'); } },
      { id: 'prova', dur: 6, title: 'A prova: recebido, mas não aplicado', yk: 'NA RÉPLICA DE RECIFE',
        code: ['SELECT pg_last_wal_receive_lsn();  -- 0/8004430', 'SELECT pg_last_wal_replay_lsn();   -- 0/8000060', "SELECT pg_last_wal_replay_lsn()", "       >= '0/8004430'::pg_lsn;     -- f"],
        story: 'Dá para provar o atraso com dois números. Em Recife, o último LSN <b>recebido</b> é <code>0/8004430</code>, o token do 1055. O último <b>aplicado</b> é <code>0/8000060</code>, atrás. A comparação <code>replay_lsn &gt;= token</code> devolve <code>f</code>: a aplicação <b>sabe</b> que a réplica ainda não alcançou o commit e manda a leitura ao primário.',
        look: 'Na face de Recife, as duas marcas: recebido e aplicado. O balão mostra o f.',
        key: 'Comparar o LSN aplicado com o token diz se a réplica já tem o pedido.',
        f(o, t) { lit(o, 'sp'); o.on.rec = 'bad'; o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['recebido 0/8004430', 'acc'], ['aplicado 0/8000060', 'bad'], [t > 1.5 ? 'replay >= token: f' : '', 'bad']); o.rows.rec.tape = W55('recv');
          o.cnt = [['RECEBIDO', '0/8004430'], ['APLICADO', '0/8000060', 'bad'], ['replay >= token', t > 1.5 ? 'f' : '…', 'bad']];
          o.res = t > 1.5 ? [['f: a leitura vai ao primário', 'acc']] : [];
          if (t > 1.5) T(o, [650, 262, 52], "replay >= '0/8004430': f", 'bad'); } },
      { id: 'consertos', dur: 9, title: 'Três consertos: primário, token, remote_apply', yk: 'O QUE CADA UM CUSTA',
        code: ['(a) ler do primário por N s: +80 ms', '(b) token: replay_lsn >= 0/8004430?', '    f → lê do primário; t → Recife', '(c) remote_apply: o commit espera', '    Recife aplicar: ~82 ms por commit'],
        story: 'Três jeitos de a Lena ver o próprio pedido. (a) Depois de escrever, as leituras dela vão ao primário por alguns segundos: custa os <b>80 ms</b> de ida e volta até SP. (b) A aplicação guarda o <b>token</b> e só lê de Recife quando <code>replay_lsn &gt;= token</code>; senão, vai ao primário. (c) <code>remote_apply</code> só nesse commit: ele espera Recife aplicar, cerca de <b>82 ms</b> num dia comum, e mais com Recife 800 ms atrás.',
        look: 'A leitura da Lena atravessa o cabo de Recife até SP e volta com o 1055. A tela mostra o pedido.',
        key: 'Read-your-writes se conserta lendo do primário, levando o token ou esperando a réplica aplicar.',
        f(o, t) { lit(o, 'sp', 'lena'); o.on.rec = 'bad'; o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('recv');
          const k = t < 3 ? 0 : t < 6 ? 1 : 2, got = k < 2 && (t % 3) > 1.6;
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['aplicado 0/8000060', 'bad'], [k === 1 ? 'token: f → SP' : 'atrás do token', 'dim']); o.rows.rec.tape = W55('recv');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', [k === 2 ? 'commit com remote_apply' : 'atende a leitura', 'acc'], [k === 2 ? 'espera Recife aplicar' : '+80 ms', 'dim']); o.rows.sp.tape = W55('ok');
          o.rows.lena = act('Lena', 'app', ['meus pedidos', 'dim'], [k === 2 ? 'commit: ~82 ms' : got ? '1055 · 34,90' : 'lendo de SP…', k === 2 || got ? 'acc' : 'dim']);
          o.beams.push({ pts: CAB.lena, on: true }); o.beams[1] = { pts: CAB.rec, on: true };
          if (k < 2) pk(o, got ? rev(LENA_SP) : LENA_SP, ((t % 3) / 1.6) % 1, got ? '1055' : 'leitura', 'acc');
          else pk(o, CAB.rec, ((t - 6) / 1.5) % 1, 'remote_apply');
          o.cnt = [['(a) PRIMÁRIO', '+80 ms', k === 0 ? '' : 'dim'], ['(b) TOKEN', 'f → SP', k === 1 ? '' : 'dim'], ['(c) remote_apply', '~82 ms/commit', k === 2 ? '' : 'dim']];
          o.res = [[['(a) ler do primário por N segundos', '(b) levar o token do commit', '(c) remote_apply só nesse commit'][k], 'acc']]; } },
      { id: 'errado', dur: 8, title: 'E se der errado: Recife não alcança o token', yk: 'O TOKEN SEMPRE ATRÁS', act: ['pause', ''],
        code: ['replay_lsn >= token  -- f, f, f…', 'toda leitura depois de comprar vai a SP', '+80 ms cada, no primário que já', 'recebe todas as escritas', 'SELECT pg_wal_replay_resume();'],
        story: 'Se Recife não alcança, a comparação dá <code>f</code> o tempo todo, e toda leitura de quem acabou de comprar vai ao primário: <b>+80 ms</b> cada uma, no servidor que já recebe todas as escritas da Black Friday. O token protege a Lena de ver o passado, e o custo cai em SP. Quando Recife volta a aplicar (<code>pg_wal_replay_resume()</code>, ou na Black Friday às 20:10:00.802), o 1055 aparece lá.',
        look: 'As leituras correm de Recife a SP uma atrás da outra. Retome o replay no painel: o 1055 acende em Recife e a leitura volta para perto.',
        key: 'O token não deixa a Lena ver o passado, mas manda a conta para o primário.',
        f(o, t) { lit(o, 'sp'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok');
          const ok = !paused && t > 2.5;
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['1055 aplicado', 'dim']); o.rows.rio.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'RÉPLICA', [ok ? '1055 aplicado' : paused ? 'replay: PAUSADO' : '800 ms atrás', ok ? 'acc' : 'bad'], [ok ? 'replay >= token: t' : 'replay >= token: f', ok ? 'acc' : 'bad']); o.rows.rec.tape = W55(ok ? 'ok' : 'recv');
          o.on.rec = ok ? 1 : 'bad'; o.on.lena = 1;
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['todas as escritas', 'acc'], [ok ? 'leituras voltam a Recife' : '+ as leituras pós-compra', ok ? 'dim' : 'bad']); o.rows.sp.tape = W55('ok');
          o.rows.lena = act('Lena', 'app', ['meus pedidos', 'dim'], ['1055 · 34,90', 'acc'], [ok ? 'de Recife: ~2 ms' : 'de SP: +80 ms', ok ? 'dim' : 'bad']);
          o.beams.push({ pts: CAB.lena, on: true, flow: ok }); o.beams[1] = { pts: CAB.rec, on: !ok, tone: ok ? '' : 'bad' };
          if (!ok) { pk(o, LENA_SP, (t * 0.7) % 1, 'leitura', 'bad'); pk(o, LENA_SP, (t * 0.7 + 0.5) % 1, '', 'bad'); }
          o.cnt = [['replay >= token', ok ? 't' : 'f', ok ? '' : 'bad'], ['CADA LEITURA', ok ? '~2 ms' : '+80 ms', ok ? 'dim' : 'bad'], ['REPLAY', paused ? 'pausado' : 'aplicando', 'dim']];
          o.res = ok ? [['o 1055 chegou: a leitura volta a Recife', 'acc']] : [['as leituras pós-compra pesam em SP', 'bad']];
          if (!ok) T(o, TF(425), 'f → SP: +80 ms por leitura', 'bad'); } },
    ],
    assincrona: [
      { id: 'pronto', dur: 6, title: 'Assíncrona: pronto em 2 ms', yk: 'SÓ O DISCO LOCAL',
        code: ["synchronous_standby_names = ''", 'commit = 2 ms (só o disco de SP)', '1 s ÷ 2 ms = 500 commits/s por conexão', 'o WAL sai depois do "pronto"'],
        story: 'Na replicação assíncrona o primário grava o 1055 no próprio disco (<b>2 ms</b>), responde "pronto" à Lena e só então manda o log às réplicas. Uma conexão que só faz commits dá <b>500 por segundo</b>. Nenhum ack de réplica entra na conta.',
        look: 'O 1055 acende em SP e o "pronto" sai para a Lena antes de qualquer luz entrar nos cabos.',
        key: 'Assíncrona: o commit não espera nenhuma réplica.',
        f(o, t) { const ms = lin(t, 0.6, 3.6, 0, 3); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 · commit local', 'acc'], [ms >= 2 ? 'pronto em 2 ms' : 'gravando…', ms >= 2 ? 'acc' : 'dim']); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          if (ms >= 2) { o.on.lena = 1; o.rows.lena = act('Lena', 'app', ['pedido 1055', 'dim'], ['confirmado', 'acc'], ['em 2 ms', 'dim']); }
          o.cnt = [['COMMIT', ms >= 2 ? '2 ms' : '…'], ['COMMITS/S', '500 por conexão', 'dim'], ['ACKS ESPERADOS', '0', 'dim']];
          o.res = ms >= 2 ? [['pronto: 2 ms', 'acc']] : [];
          if (ms >= 2) T(o, [175, 240, 58], 'pronto: 2 ms'); } },
      { id: 'depois', dur: 7, title: 'As fitas chegam depois', yk: 'A JANELA',
        code: ['Rio:    chega em 5 ms, 300 ms atrás', 'Recife: chega em 40 ms, 800 ms atrás', '(Black Friday: aplicar é mais lento)', 'até aplicar, o 1055 só existe em SP'],
        story: 'Depois do "pronto", o log sai pelos cabos: chega ao Rio em 5 ms e a Recife em 40 ms. Na Black Friday aplicar é mais lento que gerar, e as réplicas ficam <b>300 ms</b> (Rio) e <b>800 ms</b> (Recife) atrás. Até as réplicas aplicarem, o 1055 confirmado só existe aplicado em SP.',
        look: 'Os registros correm pelos cabos depois do commit. Nas réplicas o 1055 chega em contorno e fica esperando a vez.',
        key: 'O preço da assíncrona é a janela entre o "pronto" e a cópia.',
        f(o, t) { const ms = lin(t, 0.4, 4.4, 2, 60); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 confirmado', 'acc'], ['envia o WAL depois', 'dim']); o.rows.sp.tape = W55('ok');
          const rio = ms < 7 ? 'none' : 'recv', rec = ms < 42 ? 'none' : 'recv';
          o.rows.rio = act('pg-rio', 'RÉPLICA', ['300 ms atrás', 'acc']); o.rows.rio.tape = W55(rio);
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['800 ms atrás', 'acc']); o.rows.rec.tape = W55(rec);
          o.beams = [{ pts: CAB.rio, on: ms < 7 }, { pts: CAB.rec, on: ms < 42 }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL 1055'); pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055');
          o.cnt = [['RELÓGIO', hms(ms)], ['APLICADO NO RIO', '.302', 'dim'], ['EM RECIFE', '.802', 'dim']];
          o.res = [['confirmado, ainda não copiado', 'acc']]; } },
      { id: 'errado', dur: 7, title: 'E se der errado: SP cai dentro da janela', yk: 'RPO DA ASSÍNCRONA',
        code: ['30 pedidos/s na Black Friday', 'Rio:    30 × 0,3 = 9 pedidos perdidos', 'Recife: 30 × 0,8 = 24 pedidos perdidos', 'confirmados à cliente, e perdidos'],
        story: 'Se SP cai dentro dessa janela, o que não chegou às réplicas some. A 30 pedidos por segundo: <b>9</b> pedidos se o Rio for promovido e <b>24</b> se fosse Recife. Cada um deles recebeu "pronto" em 2 ms.',
        look: 'SP fica vermelho; as células que estavam a caminho viram vermelhas nas réplicas.',
        key: 'Assíncrona: commit rápido, perda possível.',
        f(o, t) { const down = t > 0.8; o.on.sp = down ? 'bad' : 1;
          o.rows.sp = act('pg-sp', down ? 'FORA DO AR' : 'PRIMÁRIO', [down ? 'caiu' : '30 pedidos/s', down ? 'bad' : 'acc']); o.rows.sp.tape = BF(0);
          o.rows.rio = act('pg-rio', 'RÉPLICA', [down ? 'perdeu 9' : '300 ms atrás', down ? 'bad' : 'acc']); o.rows.rio.tape = BF(3, down ? 'bad' : 'recv');
          o.rows.rec = act('pg-recife', 'RÉPLICA', [down ? 'perdeu 24' : '800 ms atrás', down ? 'bad' : 'acc']); o.rows.rec.tape = BF(8, down ? 'bad' : 'recv');
          o.beams = [{ pts: CAB.rio, on: !down, flow: true, tone: down ? 'bad' : '' }, { pts: CAB.rec, on: !down, flow: true, tone: down ? 'bad' : '' }];
          o.cnt = [['PERDIDOS (RIO)', down ? '9' : '…', 'bad'], ['PERDIDOS (RECIFE)', down ? '24' : '…', 'bad'], ['COMMIT', '2 ms', 'dim']];
          o.res = down ? [['9 ou 24 pedidos confirmados somem', 'bad']] : []; } },
    ],
    semi: [
      { id: 'espera', dur: 7, title: 'Semi-síncrona: espera o Rio, 12 ms', yk: 'UM ACK',
        code: ['synchronous_standby_names =', "  'FIRST 1 (rio, recife)'", 'commit = 2 + 10 = 12 ms', '1 s ÷ 12 ms = 83 commits/s', 'rio | sync · recife | potential'],
        story: 'Na semi-síncrona o primário espera <b>uma</b> réplica, a mais perto: o Rio. O commit leva o disco local mais a ida e volta até o Rio: 2 + 10 = <b>12 ms</b>, ou 83 commits por segundo por conexão. No PostgreSQL isso é <code>FIRST 1 (rio, recife)</code>, e o <code>pg_stat_replication</code> mostra o Rio como <code>sync</code> e Recife como <code>potential</code>.',
        look: 'O registro vai ao Rio, o ack volta, e só então o "pronto" sai para a Lena.',
        key: 'Semi-síncrona: o commit espera o ack de uma réplica.',
        f(o, t) { const ms = lin(t, 0.4, 5, 0, 16); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 · espera o Rio', 'acc'], [ms >= 12 ? 'pronto em 12 ms' : ms >= 7 ? 'ack voltando…' : 'WAL indo ao Rio…', ms >= 12 ? 'acc' : 'dim']); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          o.rows.rio = act('pg-rio', 'RÉPLICA · SYNC', [ms >= 7 ? 'gravou: manda o ack' : 'Rio · só lê', ms >= 7 ? 'acc' : 'dim']); o.rows.rio.tape = W55(ms >= 7 ? 'recv' : 'none'); if (ms >= 7) o.on.rio = 1;
          o.rows.rec = act('pg-recife', 'RÉPLICA · POTENTIAL', ['recebe sem esperar', 'dim']);
          if (ms >= 12) { o.on.lena = 1; o.rows.lena = act('Lena', 'app', ['pedido 1055', 'dim'], ['confirmado', 'acc'], ['em 12 ms', 'dim']); }
          o.beams = [{ pts: CAB.rio, on: ms > 2 && ms < 12 }, { pts: CAB.rec }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL 1055'); pk(o, rev(CAB.rio), travel(ms, 7, 5), 'ack');
          o.cnt = [['COMMIT', ms >= 12 ? '12 ms' : `${Math.round(ms)} ms…`], ['COMMITS/S', '83 por conexão', 'dim'], ['ACKS ESPERADOS', '1 (Rio)', 'dim']];
          o.res = ms >= 12 ? [['pronto: 2 + 10 = 12 ms', 'acc']] : []; } },
      { id: 'recife', dur: 6, title: 'Recife recebe depois, sem esperar', yk: 'RPO ZERO ENQUANTO O RIO RESPONDE',
        code: ['o 1055 confirmado já está no Rio', 'Recife recebe em 40 ms (assíncrona)', 'SP cai agora → promove o Rio: perda 0', 'se o Rio cai, Recife vira sync (82 ms)'],
        story: 'Quando a Lena recebe o "pronto", o 1055 já está gravado no Rio. Se SP cair agora, promove-se o Rio e nada se perde: RPO zero enquanto o Rio responde. Recife recebe o log do jeito assíncrono, 40 ms depois. Se o Rio cair, Recife vira <code>sync</code> e o commit passa a 82 ms.',
        look: 'O Rio acende com o 1055; o registro ainda corre pelo cabo longo até Recife.',
        key: 'A semi-síncrona compra RPO zero com uma ida e volta curta.',
        f(o, t) { const ms = lin(t, 0.4, 4, 12, 60); lit(o, 'sp', 'rio');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 confirmado', 'acc'], ['em 12 ms', 'dim']); o.rows.sp.tape = W55('ok');
          o.rows.rio = act('pg-rio', 'RÉPLICA · SYNC', ['tem o 1055', 'acc'], ['RPO 0', 'acc']); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'RÉPLICA · POTENTIAL', [ms >= 42 ? 'recebeu o 1055' : 'recebe sem esperar', 'dim']); o.rows.rec.tape = W55(ms >= 42 ? 'recv' : 'none');
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: ms < 42 }];
          pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055');
          o.cnt = [['RPO', '0 (Rio vivo)'], ['RECIFE', ms >= 42 ? 'recebido' : 'a caminho', 'dim'], ['COMMIT', '12 ms', 'dim']];
          o.res = [['perda zero se o Rio responde', 'acc']]; } },
      { id: 'errado', dur: 9, title: 'E se der errado: o Rio some e a garantia some junto', yk: 'MARIADB / MYSQL',
        code: ['o Rio para de mandar ack', 'rpl_semi_sync_master_timeout = 10000 ms', 'passou 10 s: "reverts to asynchronous"', 'sem erro: a loja acha que tem RPO 0', 'PostgreSQL: espera (não volta)'],
        story: 'No MariaDB e no MySQL a semi-síncrona tem prazo. Se o Rio para de responder, o primário espera o <code>rpl_semi_sync_master_timeout</code>, <b>10.000 ms</b> por padrão, e então volta a ser <b>assíncrono</b>, sem erro. A loja acha que tem RPO zero e já tem de novo a janela de perda. O PostgreSQL faz o contrário: com <code>FIRST 1 (rio, recife)</code> passa a esperar Recife e, sem nenhuma réplica, espera para sempre.',
        look: 'O Rio fica vermelho. O relógio conta até 10 s com os commits parados; aí o modo troca para assíncrona e os commits voltam a 2 ms, sem cópia.',
        key: 'A semi-síncrona do MariaDB troca a garantia por disponibilidade sem avisar.',
        f(o, t) { const s = lin(t, 0.6, 5.6, 0, 10), rev_ = s >= 10; o.on.rio = 'bad'; o.on.sp = rev_ ? 'bad' : 1;
          o.rows.sp = act('pg-sp', rev_ ? 'ASSÍNCRONA' : 'SEMI-SÍNCRONA', [rev_ ? 'commit em 2 ms, sem cópia' : 'commit esperando o Rio', rev_ ? 'bad' : 'acc'], [rev_ ? 'nenhum erro' : `há ${dec(s)} s`, 'dim']); o.rows.sp.tape = W55(rev_ ? 'ok' : 'recv');
          o.rows.rio = act('pg-rio', 'FORA DO AR', ['sem ack', 'bad']); o.rows.rio.tape = W55('none');
          o.rows.rec = act('pg-recife', 'RÉPLICA', ['recebe quando der', 'dim']);
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, on: rev_, flow: rev_ }];
          o.cnt = [['ESPERANDO O ACK', `${dec(Math.min(s, 10))} s`, rev_ ? 'dim' : ''], ['MODO', rev_ ? 'assíncrona' : 'semi', rev_ ? 'bad' : 'dim'], ['ERRO', 'nenhum', rev_ ? 'bad' : 'dim']];
          o.res = rev_ ? [['voltou a assíncrona sem avisar', 'bad']] : [];
          if (rev_) T(o, TF(425), 'reverts to asynchronous', 'bad'); } },
    ],
    sincrona: [
      { id: 'acks', dur: 7, title: 'Síncrona: espera os dois acks, 82 ms', yk: 'DOIS ACKS',
        code: ['synchronous_standby_names =', "  'FIRST 2 (rio, recife)'", 'commit = 2 + máx(10, 80) = 82 ms', '1 s ÷ 82 ms = 12 commits/s', '(lab, sem rede: 8,1 ms com 1 réplica)'],
        story: 'Na síncrona o primário espera o <b>ack</b> do Rio e de Recife. O commit leva o disco local mais a réplica mais lenta: 2 + máx(10, 80) = <b>82 ms</b>, ou 12 commits por segundo por conexão. No laboratório, sem rede, o commit com uma réplica síncrona no mesmo computador levou 8,1 ms; a rede da loja se soma a isso.',
        look: 'O ack do Rio volta logo; o "pronto" só sai quando o de Recife atravessa o cabo longo.',
        key: 'Síncrona: o commit espera a réplica mais lenta.',
        f(o, t) { const ms = lin(t, 0.4, 5.6, 0, 90); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 · espera 2 acks', 'acc'], [ms >= 82 ? 'pronto em 82 ms' : `acks: ${(ms >= 12) + (ms >= 82)} de 2`, ms >= 82 ? 'acc' : 'dim']); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          o.rows.rio = act('pg-rio', 'RÉPLICA · SYNC', [ms >= 7 ? 'gravou: ack' : 'Rio · só lê', ms >= 7 ? 'acc' : 'dim']); o.rows.rio.tape = W55(ms >= 7 ? 'recv' : 'none'); if (ms >= 7) o.on.rio = 1;
          o.rows.rec = act('pg-recife', 'RÉPLICA · SYNC', [ms >= 42 ? 'gravou: ack' : 'Recife · só lê', ms >= 42 ? 'acc' : 'dim']); o.rows.rec.tape = W55(ms >= 42 ? 'recv' : 'none'); if (ms >= 42) o.on.rec = 1;
          if (ms >= 82) { o.on.lena = 1; o.rows.lena = act('Lena', 'app', ['pedido 1055', 'dim'], ['confirmado', 'acc'], ['em 82 ms', 'dim']); }
          o.beams = [{ pts: CAB.rio, on: ms > 2 && ms < 12 }, { pts: CAB.rec, on: ms > 2 && ms < 82 }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL'); pk(o, rev(CAB.rio), travel(ms, 7, 5), 'ack');
          pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055'); pk(o, rev(CAB.rec), travel(ms, 42, 40), 'ack');
          o.cnt = [['COMMIT', ms >= 82 ? '82 ms' : `${Math.round(Math.min(ms, 82))} ms…`], ['COMMITS/S', '12 por conexão', 'dim'], ['ACKS', `${(ms >= 12) + (ms >= 82)} de 2`, 'dim']];
          o.res = ms >= 82 ? [['pronto: 2 + máx(10, 80) = 82 ms', 'acc']] : []; } },
      { id: 'rpo', dur: 6, title: 'RPO zero: o 1055 já está nas três cópias', yk: 'O QUE A ESPERA COMPRA',
        code: ['"pronto" só depois dos dois acks', 'SP cai agora → perda 0', 'on (padrão): a réplica gravou em disco', 'remote_apply: a réplica aplicou', '(só assim a leitura lá vê o 1055)'],
        story: 'Quando a Lena recebe o "pronto", o 1055 já está gravado nas três cópias: se SP cair agora, nada se perde. A leitura em dia é outra conta: com o nível padrão (<code>on</code>) a réplica <b>gravou</b> o log em disco; só com <code>remote_apply</code> ela já <b>aplicou</b>, e a Lena vê o pedido lendo de Recife.',
        look: 'As três fitas com o 1055. Em Recife ele fica em contorno até aplicar.',
        key: 'Síncrona dá RPO zero; leitura em dia pede remote_apply.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec'); const ap = t > 2.5;
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['1055 nas 3 cópias', 'acc'], ['RPO 0', 'acc']); o.rows.sp.tape = W55('ok');
          o.rows.rio = act('pg-rio', 'RÉPLICA · SYNC', ['gravado em disco', 'dim']); o.rows.rio.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'RÉPLICA · SYNC', ['gravado em disco', 'dim'], [ap ? 'aplicado: visível' : 'aplicar é outra etapa', ap ? 'acc' : 'dim']); o.rows.rec.tape = W55(ap ? 'ok' : 'recv');
          o.cnt = [['RPO', '0'], ['CÓPIAS COM O 1055', '3', 'dim'], ['LEITURA EM DIA', 'remote_apply', 'dim']];
          o.res = [['perda zero se SP cair', 'acc']]; } },
      { id: 'errado', dur: 9, title: 'E se der errado: Recife sai do ar e o commit trava', yk: 'pg_stat_activity',
        code: ['wait_event_type = IPC', 'wait_event      = SyncRep', 'o 1055 não fica visível a ninguém', 'a loja para de vender', "conserto: synchronous_standby_names = ''"],
        story: 'Recife sai do ar. Com a exigência das duas réplicas, o <code>INSERT</code> do pedido <b>fica esperando</b>: o <code>pg_stat_activity</code> mostra <code>wait_event_type = IPC</code> e <code>wait_event = SyncRep</code>, e o pedido não fica visível para outras sessões. A 30 pedidos por segundo, todos esperam: <b>a loja para de vender</b>. Ao tirar a exigência (<code>synchronous_standby_names = \'\'</code>), o pedido aparece.',
        look: 'Recife fica vermelho e o cabo longo apaga. Os commits se empilham na frente de SP com o relógio correndo.',
        key: 'Síncrona exigindo todas as réplicas para a loja quando uma cai.',
        f(o, t) { const s = lin(t, 0.8, 6.8, 0, 20); o.on.rec = 'bad'; o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', 'PRIMÁRIO', ['commit esperando', 'bad'], ['wait_event = SyncRep', 'bad'], [`há ${Math.round(s)} s`, 'dim']); o.rows.sp.tape = W55('recv');
          o.rows.rio = act('pg-rio', 'RÉPLICA · SYNC', ['ack enviado', 'acc']); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'FORA DO AR', ['sem ack', 'bad']); o.rows.rec.tape = W55('none');
          o.rows.lena = act('Lena', 'app', ['pedido 1055', 'dim'], ['processando…', 'bad']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, tone: 'bad' }];
          o.piles.push({ p: [175, 392, PL + 2], v: 30 * s, f: s / 20 });
          o.cnt = [['ESPERANDO', `${Math.round(s)} s`, 'bad'], ['COMMITS PARADOS', thou(30 * s), 'bad'], ['wait_event', 'SyncRep', 'dim']];
          o.res = [['a loja para de vender', 'bad']];
          T(o, TF(650), 'Recife fora: SyncRep', 'bad'); } },
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
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, papel à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.48 : W_ - 10); x.fillText(d.name, u(5), u(13)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, 12, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(13)); x.textAlign = 'left'; } }
  // a fita do WAL: células em fila; acesa = aplicada, contorno = recebida, vazia = ainda não chegou, vermelha = perdida/erro
  function drawTape(x, u, C, tape, W_, H_) {
    const n = tape.length, gap = 3, cw = Math.min(60, (W_ - 10 - gap * (n - 1)) / n), ch = 22, y0 = H_ - ch - 5, light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, 'WAL', 10, 30); x.fillText('WAL', u(5), u(y0 - 8));
    tape.forEach(([lab, s], i) => { const X = 5 + i * (cw + gap);
      if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      x.strokeStyle = s === 'recv' ? accC() : s === 'none' ? C.line : s === 'bad' ? BAD() : accC(); x.lineWidth = u(s === 'recv' ? 1.4 : 0.6);
      if (s === 'recv') x.setLineDash([u(2.2), u(1.6)]); x.strokeRect(u(X + 0.5), u(y0 + 0.5), u(cw - 1), u(ch - 1)); x.setLineDash([]);
      if (lab) { x.textAlign = 'center'; x.fillStyle = s === 'ok' || s === 'bad' ? (light ? '#f6f6f5' : '#141516') : s === 'recv' ? accC() : INK();
        fitFont(x, u, lab, 14, cw - 4); x.fillText(lab, u(X + cw / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; } });
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi;
    head(x, u, d, W_, col, 18); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(26)); x.lineTo(u(W_ - 4), u(26)); x.stroke();
    let y = 41; for (const [text, tn] of d.rows || []) { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, 16, W_ - 10); x.fillText(text, u(5), u(y)); } y += 22; }
    if (d.tape) drawTape(x, u, C, d.tape, W_, H_);
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? thou(pl.v) : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab); }
        Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.5; moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 ? 0.35 : 0); } }
    for (; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.code;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const MODES = () => `<table class="h3-sum"><tr><th>modo</th><th>espera</th><th>commit</th><th>commits/s</th></tr><tr${sc === 'assincrona' ? ' class="on"' : ''}><td>assíncrona</td><td>só o disco</td><td>2 ms</td><td>500</td></tr><tr${sc === 'semi' ? ' class="on"' : ''}><td>semi (Rio)</td><td>2 + 10</td><td>12 ms</td><td>83</td></tr><tr${sc === 'sincrona' ? ' class="on"' : ''}><td>síncrona</td><td>2 + máx(10, 80)</td><td>82 ms</td><td>12</td></tr></table>`;
  const DATA = {
    'primary-replica': () => `<li>Laboratório do SDLabs (PostgreSQL 14): <b>55432</b> = SP, <b>55433</b> = Rio, <b>55434</b> = Recife</li><li><code>pg_stat_replication</code> no primário (saída real):</li><table class="h3-sum"><tr><th></th><th>recife</th><th>rio</th></tr><tr><td>state</td><td>streaming</td><td>streaming</td></tr><tr><td>sync_state</td><td>async</td><td>async</td></tr><tr><td>replay_lsn</td><td>0/8000000</td><td>0/8000000</td></tr><tr><td>write_lag</td><td>00:00:00.100378</td><td>00:00:00.024312</td></tr></table><li>Esses 100 e 24 ms são do laboratório, sem rede; os 15 e 60 ms da loja num dia comum são o exemplo</li><li>Na réplica: <b>ERROR: cannot execute INSERT in a read-only transaction</b>; <code>pg_is_in_recovery()</code> = t</li><li>Pedido 1055: 1 caneca azul 19,90 + frete 15,00 = <b>34,90</b>; estoque 37 → 36</li>`,
    queda: () => `<table class="h3-sum"><tr><th>conta</th><th>resultado</th></tr><tr><td>30/s × 0,3 s (Rio)</td><td>9 pedidos</td></tr><tr><td>30/s × 0,8 s (Recife)</td><td>24 pedidos</td></tr><tr><td>5/s × 0,06 s (dia comum)</td><td>~0,3</td></tr><tr class="on"><td>RTO: 30 s (ttl) + 5 s</td><td>35 s</td></tr><tr><td>30/s × 35 s</td><td>1.050 tentativas</td></tr></table><li><code>pg_ctl -D rio promote</code> → <code>pg_is_in_recovery()</code> = f; <b>TimeLineID: 2</b>; o primário velho volta com <code>pg_rewind</code></li><li>Patroni (padrão): <code>ttl: 30</code>, <code>loop_wait: 10</code>, <code>retry_timeout: 10</code></li><li>Raft: eleição sorteada entre <b>150 e 300 ms</b>; voto só para log igual ou mais novo; quórum <b>2 de 3</b></li>`,
    multi: () => `<table class="h3-sum"><tr><th>escrita</th><th>de verdade</th><th>carimbo</th><th>vetor</th></tr><tr><td>SP: Rua do Sol, 200</td><td>.100</td><td>.100</td><td>{SP:2, Rec:0}</td></tr><tr class="on"><td>Recife: Rua da Aurora, 100</td><td>.150</td><td>.030 (−120 ms)</td><td>{SP:1, Rec:1}</td></tr></table><li>LWW escolhe <b>SP</b> (.100 &gt; .030) e perde a escrita mais nova</li><li>Vetor de versão: nenhum domina → <b>concorrentes</b></li><li>1056: colisão hipotética; saídas: ímpares/pares ou UUID/ULID</li><li>Com o cabo cortado: Primary/Replica recusa escrita em Recife (CP para escrita); Primary/Primary aceita nos dois (AP)</li>`,
    lag: () => `<li>Laboratório, replay pausado em Recife depois do <code>INSERT</code> do 1055:</li><table class="h3-sum"><tr><th>consulta</th><th>resultado</th></tr><tr><td>pg_current_wal_lsn() (primário)</td><td>0/8004430</td></tr><tr><td>pg_last_wal_receive_lsn()</td><td>0/8004430</td></tr><tr class="on"><td>pg_last_wal_replay_lsn()</td><td>0/8000060</td></tr><tr><td>replay &gt;= '0/8004430'</td><td>f</td></tr></table><li>O laboratório carrega só os pedidos 1041–1052: a consulta da Lena devolve só o 1051</li><li>Na outra réplica, sem pausa, o 1055 já aparece; depois de <code>pg_wal_replay_resume()</code>, em Recife também</li><li>Consertos: primário <b>+80 ms</b> por leitura · token · <code>remote_apply</code> <b>~82 ms</b> por commit</li>`,
    assincrona: () => MODES() + `<li>Black Friday: Rio <b>300 ms</b> e Recife <b>800 ms</b> atrás; perda 30 × 0,3 = <b>9</b> e 30 × 0,8 = <b>24</b></li><li>Dia comum: Rio 15 ms, Recife 60 ms; perda ~0,3</li>`,
    semi: () => MODES() + `<li>PostgreSQL: <code>FIRST 1 (rio, recife)</code> → <code>rio | sync | 1</code>, <code>recife | potential | 2</code>; se o Rio cai, Recife vira sync</li><li>MariaDB: <code>rpl_semi_sync_master_timeout</code> = <b>10.000 ms</b>; depois disso "reverts to asynchronous replication"</li>`,
    sincrona: () => MODES() + `<li>Medição real, sem rede: commit com 1 réplica síncrona no mesmo computador = <b>8,1 ms</b></li><li>Réplicas fora: <code>wait_event_type = IPC</code>, <code>wait_event = SyncRep</code>; o pedido não fica visível até o ack</li><li><code>synchronous_commit</code>: off, local, remote_write, <b>on</b> (padrão: gravou em disco), <b>remote_apply</b> (aplicou)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo: escrever o 1055 (Réplicas) e pausar/retomar o replay em Recife (Atraso)
  function actHtml() { const a = cur().act; if (!a) return '';
    const label = a[0] === 'pause' ? (paused ? 'Retomar o replay em Recife' : 'Pausar o replay em Recife') : a[1] + ' →';
    const sub = a[0] === 'pause' ? (paused ? 'pg_wal_replay_resume()' : 'pg_wal_replay_pause()') : 'INSERT 1055';
    return `<div class="o3-mode r3-act"><button data-r3="${a[0]}" aria-pressed="${a[0] === 'pause' && paused}">${label}<small>${sub}</small></button></div>`; }
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
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'replicas') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'replicas' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-replicas3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  // pausar no passo 1 já avança para o commit; nos outros passos só troca o estado (e reinicia o passo)
  function togglePause() { if (sc !== 'lag') return false; paused = !paused; return step === 0 && paused ? go(1) : go(step); }
  function doAct(a) { if (a === 'pause') return togglePause(); if (a === 'write') return next(); return false; }
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'replicas') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const a = e.target.closest("[data-r3]"); if (a) doAct(a.dataset.r3); });
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
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placePiles(o.piles); drawScreen(o);
    // o RTT de cada cabo fica escrito ao lado dele (balões discretos), antes dos balões do passo
    const all = (o.rtt ? [[372, 190, ZR + 10, 'RTT 10 ms', 'dim'], [372, 318, ZR + 10, 'RTT 80 ms', 'dim']] : []).concat(o.tags);
    TAGS.forEach((t, i) => { const g = all[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [24, 900, 30, 440];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.84 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.74 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.55;
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
    if (e.key === 'p' || e.key === 'P') return togglePause();
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · replay: P · arraste para girar' };
})() });
