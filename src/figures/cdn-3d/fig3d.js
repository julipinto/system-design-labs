// Figura 3D (iso-glow): CDN. A Lena, em Recife, abre a página do gato de pelúcia e o navegador pede a foto gato.jpg (120 KB).
// Cena: ao fundo, o mostrador com o tempo até a foto aparecer, o X-Cache e a última mensagem HTTP. Na frente, da esquerda para
// a direita: o celular da Lena, o edge de Recife (com a gaveta do cache) e a origem em São Paulo. Um pacote corre nas vigas
// levando o que vai dentro (GET, 200, 304, 504) e o mostrador conta os ms de cada trecho.
// Cenários (toggle e ?mode=miss|hit|expire|lab; ?step=N abre no passo N): cada um termina num "e se der errado".
// Dados: a história canônica do módulo (docs/escrita/cache-brief.md). Domínio, ETag e o nome X-Cache são exemplos.
// O modo lab segue exemplos/cache/cdn/main.go do repositório público: chave = sha1(método + path + query), sem TTL.
FIGS3D.push({ id: 'cdn', name: 'CDN', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // cores de texto: no claro, versões bem escuras (o texto miúdo precisa de folga para o pixel na tela dar ≥ 4.5:1)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const WARN = () => theme === 'light' ? '#6e4100' : '#ffb02e';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'warn' ? WARN() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const KEY1 = 'f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa';   // sha1("GET/gato.jpg")
  const KEY2 = '442f2a6a3690de956c20bdcc83335b9701616d53';   // sha1("GET/gato.jpgv=2")
  const short = k => k.slice(0, 4) + '…' + k.slice(-4);
  const CC = 'Cache-Control: public, max-age=3600';
  const GET = ['GET /gato.jpg HTTP/1.1', 'Host: cdn.loja.example'];
  const R200 = (v = 1) => ['HTTP/1.1 200 OK', 'Content-Type: image/jpeg', 'Content-Length: 122880', CC, `ETag: "gato-v${v}"`];
  const OUT = (xc, age, v = 1) => ['HTTP/1.1 200 OK', 'Content-Length: 122880', CC, `ETag: "gato-v${v}"`, `Age: ${age}`, `X-Cache: ${xc}`];
  const R504 = ['HTTP/1.1 504 Gateway Timeout', 'X-Cache: MISS', '(sem foto)'];

  const SC = ['miss', 'hit', 'expire', 'lab'];
  const SCNAME = { miss: 'Miss', hit: 'Hit', expire: 'Expira', lab: 'Lab' };
  const AULA = { miss: 'aula-6-cache-aside-write-through-write-behind-e-cdn', hit: 'aula-6-cache-aside-write-through-write-behind-e-cdn', expire: 'aula-6-cache-aside-write-through-write-behind-e-cdn', lab: 'aula-7-criando-uma-cdn' };
  let clk = 0, sc = 'miss', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', msgKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; } const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-cdn3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7;
  const PW = 580, PD = 304;
  plateWith(g0, PW, PD, [[14, 14], [PW - 14, 14], [14, PD - 14], [PW - 14, PD - 14]]);
  hazeAndShadow(g0, PW / 2, PD / 2, 7.2, 4.0);
  // mostrador ao fundo, alto: o vão entre ele e as caixas é onde ficam os balões
  rbox(16, 10, PL, 548, 12, 134, 5, bodyMat, g0);
  const scr = faceCanvas('front', 20, 22, 138, 540, 94, 5, g0);
  // chão: as duas cidades, a distância e o custo de cada trecho
  const floor = faceCanvas('top', 10, 124, PL, 560, 176, 4, g0, true);
  // celular da Lena (deitado, tela para cima)
  const phMat = capMat(); twCaps.push(phMat);
  rbox(20, 168, PL, 96, 118, 9, 10, phMat, g0);
  const phone = faceCanvas('top', 23, 171, PL + 9, 90, 112, 8, g0);
  // edge de Recife: a caixa com a gaveta do cache
  const edMat = capMat(); twCaps.push(edMat);
  rbox(168, 158, PL, 166, 128, 28, 8, edMat, g0);
  const edTop = faceCanvas('top', 171, 161, PL + 28, 160, 122, 7, g0);
  const edFr = faceCanvas('front', 171, 286, PL + 26, 160, 22, 8, g0);
  // origem em São Paulo
  const orMat = capMat(); twCaps.push(orMat);
  rbox(400, 144, PL, 164, 142, 38, 8, orMat, g0);
  const orTop = faceCanvas('top', 403, 147, PL + 38, 158, 136, 7, g0);
  const orFr = faceCanvas('front', 403, 286, PL + 36, 158, 28, 8, g0);
  // plaquinhas em pé na frente de cada vão: o custo de cada trecho
  rbox(117, 290, PL, 50, 4, 22, 1.5, bodyMat, g0);
  const sgLE = faceCanvas('front', 118, 294, PL + 21, 48, 20, 8, g0);
  rbox(337, 290, PL, 62, 4, 30, 1.5, bodyMat, g0);
  const sgEO = faceCanvas('front', 338, 294, PL + 29, 60, 28, 8, g0);
  // o pacote que corre nas vigas
  const pkMat = capMat(); twCaps.push(pkMat); pkMat.emissiveIntensity = 1.1;
  const pkG = new THREE.Group(); g0.add(pkG); rbox(-14, -10, 0, 28, 20, 12, 3, pkMat, pkG); pkG.visible = false;
  const pkGlow = glowPoints([W(0, 0, 0)], 0.5); g0.add(pkGlow);
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 4 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-4, -4, -4, 8, 8, 8, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const a = W(...b.pts[i]), c = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 7 : 5) * TS, d = c.clone().sub(a), len = d.length();
        m.visible = true; m.material = b.bad ? beamBad : b.on ? beamOn : beamOff; m.position.copy(a).add(c).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dots && nd < DOTS.length) for (let j = 0; j < 2 && nd < DOTS.length; j++) {
        const D = DOTS[nd++], cum = cumLen(b.pts); let f = (lt * 0.9 + j * 0.5) % 1; if (b.back) f = 1 - f;
        const p = alongPts(b.pts, cum, f); D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.8); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── rótulos que olham para a câmera ──
  const tags = [];
  function tag(h = 13) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = pal3(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const fs = t.h * P, f1 = `600 ${fs}px ${MONO3}`, f2 = `600 ${fs * 0.8}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.8 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? INK() : t.tone === 'bad' ? BAD() : t.tone === 'warn' ? WARN() : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.96)' : 'rgba(18,19,20,.92)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : t.tone === 'warn' ? WARN() : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'hi' ? INK() : col; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12)];
  const PKT = tag(11);

  // ── rotas das vigas (no chão) e o custo de cada trecho ──
  const Z = 12;
  const R = { le: [[116, 236, Z], [168, 236, Z]], eo: [[334, 226, Z], [400, 226, Z]] };
  const MS = { le: 2.5, eo: 25 };        // só ida (ou só volta): Lena ↔ edge 5 ms, edge ↔ origem 50 ms
  const DUR = { le: 0.8, eo: 1.5 };      // segundos de animação de cada trecho
  // uma ida (ou volta) do pacote: rota, sentido, rótulo no pacote, de onde para onde, cabeçalhos
  const leg = (r, back, text, who, h, tone = 'acc', ms) => ({ r, back, text, who, h, tone, ms: ms ?? MS[r] });
  // percorre os trechos a partir de t0; devolve o instante em que cada trecho termina
  function run(o, t, t0, list) {
    let a = t0; const ends = [];
    for (const L of list) {
      const d = DUR[L.r]; ends.push(a + d);
      if (t >= a) {
        const f = clamp((t - a) / d); o.ms += L.ms * f; o.msg = { who: L.who, h: L.h };
        if (f < 1) { o.pk = { r: L.r, f: L.back ? 1 - f : f, text: L.text, tone: L.tone }; o.on[L.r] = L.back ? 'back' : 'go'; }
      }
      a += d;
    }
    return ends;
  }
  const L_GET = leg('le', false, 'GET /gato.jpg', 'Lena → edge', GET);
  const L_GETO = leg('eo', false, 'GET /gato.jpg', 'edge → origem', GET);
  const L_200 = (v = 1) => leg('eo', true, `200 OK · 120 KB${v > 1 ? ' (v2)' : ''}`, 'origem → edge', R200(v));
  const L_OUT = (xc, age, v = 1, tone = 'acc') => leg('le', true, `200 · ${xc}`, 'edge → Lena', OUT(xc, age, v), tone);

  // ── o que se vê em cada passo (spec) ──
  function base() {
    return { ms: 0, msTone: 'acc', xc: '—', xcTone: 'dim', msg: null, pk: null, on: {}, bad: {}, tags: [],
      edge: { slots: [], note: '', tone: 'dim', lit: 0, lab: sc === 'lab', math: 0 },
      orig: { ver: 1, reqs: 0, down: false, lit: 0, note: '' },
      phone: { st: 'blank', ver: 1, note: '' } };
  }
  const T = (o, x, y, z, text, tone = 'acc') => o.tags.push([x, y, z, text, tone]);
  const slot = (o, s) => o.edge.slots.push(Object.assign({ name: 'gato.jpg', ver: 1, age: 0, max: 3600, st: 'fresh' }, s));
  const photo = (o, v = 1, note = '') => { o.phone.st = 'photo'; o.phone.ver = v; o.phone.note = note; };
  const xc = (o, v, tone = 'acc') => { o.xc = v; o.xcTone = tone; };
  const EDGE_T = [251, 135, 60], ORIG_T = [482, 125, 63], PHONE_T = [68, 130, 45];

  const STEPS = {
    miss: [
      { id: 'ask', dur: 3, title: 'A Lena pede a foto',
        story: 'A Lena, em Recife, abre a página do gato de pelúcia (produto 42). O navegador pede a foto gato.jpg, de 120 KB. O pedido não vai direto a São Paulo: a CDN o entrega ao servidor dela mais perto da Lena, o edge de Recife.',
        look: 'O pacote GET sai do celular e chega ao edge. A gaveta do cache do edge está vazia.',
        key: 'Quem usa CDN fala com o edge mais perto, não com a origem.',
        f(o, t) { o.phone.st = t > 0.3 ? 'loading' : 'blank'; const e = run(o, t, 0.4, [L_GET]);
          if (t > e[0]) { o.edge.note = 'procurando gato.jpg…'; o.edge.lit = 1; T(o, ...EDGE_T, 'gaveta vazia\ngato.jpg? não tenho', 'hi'); } } },
      { id: 'fetch', dur: 4.5, title: 'MISS: o edge vai até São Paulo',
        story: 'O edge procura gato.jpg no cache e não acha: é um MISS. Então ele vira cliente e pede a foto à origem, em São Paulo, a uns 2 100 km. Só essa ida e volta custa uns 50 ms, dez vezes o caminho entre a Lena e o edge.',
        look: 'A gaveta do edge diz MISS, o GET corre até a origem e volta como 200 OK com os 120 KB.',
        key: 'MISS: a cópia não está no edge, e alguém paga a viagem até a origem.',
        f(o, t) { o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → edge', h: GET }; xc(o, 'MISS', 'warn'); o.edge.note = 'MISS: buscando na origem'; o.edge.tone = 'warn'; o.edge.lit = 1;
          const e = run(o, t, 0.3, [L_GETO, L_200()]);
          if (t > e[0]) { o.orig.reqs = 1; o.orig.lit = 1; o.orig.note = 'pedido 1: GET /gato.jpg'; }
          if (t > e[1]) T(o, ...EDGE_T, 'chegou da origem:\n120 KB · max-age=3600', 'acc'); } },
      { id: 'store', dur: 4, title: 'Guarda a cópia e entrega',
        story: 'A resposta da origem traz Cache-Control: public, max-age=3600: qualquer cache pode guardar a foto por 3600 s, 1 hora. O edge grava a cópia na gaveta e entrega a foto à Lena com X-Cache: MISS e Age: 0. Do pedido até a foto: uns 55 ms.',
        look: 'A foto entra na gaveta do edge com Age 0 de 3600 e aparece no celular; o mostrador para em 55 ms.',
        key: 'max-age diz por quanto tempo a cópia vale sem perguntar à origem.',
        f(o, t) { o.phone.st = 'loading'; o.ms = 52.5; o.msg = { who: 'origem → edge', h: R200() }; xc(o, 'MISS', 'warn'); o.orig.reqs = 1;
          if (t > 0.3) { slot(o, { st: 'new' }); o.edge.note = 'guardou: vale 3600 s'; o.edge.tone = 'acc'; o.edge.lit = t < 1.4 ? 1 : 0.3; }
          const e = run(o, t, 1.2, [L_OUT('MISS', 0, 1, 'warn')]);
          if (t > e[0]) { photo(o, 1); T(o, ...PHONE_T, 'a foto chegou\n~55 ms', 'acc'); } } },
      { id: 'down', dur: 6, title: 'E se der errado: a origem caiu',
        story: 'Volte ao começo, com a gaveta vazia, mas agora a origem está fora do ar. O edge pede a foto, espera e desiste: sem cópia nenhuma, devolve 504 Gateway Timeout e a página da Lena abre sem a foto do gato. No primeiro acesso, a CDN não tem o que mostrar.',
        look: 'A origem fica vermelha, o GET não volta e o celular mostra o erro 504.',
        key: 'No MISS, a CDN só entrega o que a origem conseguir entregar.',
        f(o, t) { o.orig.down = true; o.phone.st = 'loading'; const e = run(o, t, 0.3, [L_GET, L_GETO]);
          if (t > e[0]) { xc(o, 'MISS', 'warn'); o.edge.note = 'MISS: buscando na origem'; o.edge.tone = 'warn'; o.edge.lit = 1; }
          if (t > e[1]) { o.bad.eo = true; o.edge.note = 'esperando a origem…'; o.msTone = 'bad'; o.ms = 27.5; T(o, ...ORIG_T, 'fora do ar\nnão responde', 'bad'); }
          if (t > e[1] + 1.6) { o.edge.note = 'desistiu: 504'; o.edge.tone = 'bad'; xc(o, '504', 'bad'); o.msg = { who: 'edge → Lena', h: R504 }; }
          const e2 = run(o, t, e[1] + 1.6, [leg('le', true, '504 Gateway Timeout', 'edge → Lena', R504, 'bad', 0)]);
          if (t > e2[0]) { o.phone.st = 'err'; o.ms = -1; T(o, ...PHONE_T, '504: sem foto\nnão há cópia nenhuma', 'bad'); } } },
    ],
    hit: [
      { id: 'again', dur: 3, title: 'Segundo acesso: a cópia está lá',
        story: '12 segundos depois, a Lena recarrega a página (podia ser qualquer pessoa em Recife). O pedido chega ao mesmo edge, que agora tem gato.jpg na gaveta, guardada há 12 s.',
        look: 'O GET chega ao edge; a gaveta mostra gato.jpg com Age 12 de 3600.',
        key: 'A cópia do edge serve a todos que passam por ele, não só a quem pediu primeiro.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 12 }); o.phone.st = t > 0.3 ? 'loading' : 'blank'; const e = run(o, t, 0.4, [L_GET]);
          if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'tenho: Age 12 de 3600'; o.edge.tone = 'acc'; T(o, ...EDGE_T, 'gato.jpg na gaveta\nguardada há 12 s', 'acc'); } } },
      { id: 'serve', dur: 3.5, title: 'HIT: responde sem ir a São Paulo',
        story: 'O edge confere a idade: 12 s de 3600, a cópia está fresca. Ele responde dali mesmo, com X-Cache: HIT e Age: 12. A foto aparece em uns 5 ms, 11 vezes mais rápido que no primeiro acesso, e a origem nem fica sabendo.',
        look: 'O 200 volta do edge para o celular; a viga até São Paulo fica apagada e a origem continua com 1 pedido.',
        key: 'HIT: Age menor que max-age, e a resposta sai do edge.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 12 }); o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → edge', h: GET }; xc(o, 'HIT');
          o.edge.lit = 1; o.edge.note = 'HIT: 12 < 3600, fresca'; o.edge.tone = 'acc';
          const e = run(o, t, 0.4, [L_OUT('HIT', 12)]);
          if (t > e[0]) { photo(o, 1); T(o, ...PHONE_T, 'a foto chegou\n~5 ms (antes: ~55)', 'acc'); T(o, ...ORIG_T, 'origem: nada\nainda 1 pedido', 'dim'); } } },
      { id: 'stale', dur: 6, title: 'E se der errado: a foto mudou na origem',
        story: 'A loja troca a foto por uma do gato com laço e sobe o novo gato.jpg em São Paulo, com o mesmo nome. O edge não fica sabendo: a cópia dele ainda vale (Age 12 de 3600), então segue entregando o gato sem laço como HIT por até 1 hora. Para a foto nova aparecer antes, é preciso purgar gato.jpg no edge ou mudar o nome do arquivo (gato.v2.jpg).',
        look: 'A origem mostra o gato com laço ("gato-v2"); o celular recebe o gato antigo, marcado como HIT.',
        key: 'Enquanto o max-age não vence, o edge não pergunta nada à origem.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 12 }); o.orig.ver = t > 0.3 ? 2 : 1;
          if (t > 0.3) { o.orig.lit = 1; o.orig.note = 'foto nova: "gato-v2"'; T(o, ...ORIG_T, 'foto nova aqui\nETag "gato-v2"', 'acc'); }
          o.phone.st = t > 1.4 ? 'loading' : 'blank'; const e = run(o, t, 1.5, [L_GET, L_OUT('HIT', 12, 1, 'bad')]);
          if (t > e[0]) { xc(o, 'HIT'); o.edge.lit = 1; o.edge.note = 'HIT: 12 < 3600'; o.edge.tone = 'acc'; }
          if (t > e[1]) { photo(o, 1, 'velha'); o.msTone = 'bad'; xc(o, 'HIT (velho)', 'bad'); T(o, ...PHONE_T, 'gato sem laço:\nfoto velha por até 1 h', 'bad'); } } },
    ],
    expire: [
      { id: 'aged', dur: 4, title: 'Uma hora depois: a cópia venceu',
        story: 'Passou 1 hora desde que o edge guardou a foto. A idade da cópia chega a 3600 s, igual ao max-age: ela deixa de estar fresca (fica stale). O edge não joga a cópia fora; guarda junto o ETag "gato-v1", a etiqueta da versão que a origem mandou. Aí chega um pedido da Lena.',
        look: 'A idade na gaveta corre até 3600 e a cópia fica marcada como vencida; o GET da Lena chega ao edge.',
        key: 'Vencida não quer dizer apagada: quer dizer "pergunte antes de usar".',
        f(o, t) { o.orig.reqs = 1; const age = Math.round(12 + (3600 - 12) * clamp((t - 0.2) / 1.6) ** 1.5);
          slot(o, { age, st: age >= 3600 ? 'stale' : 'fresh' }); if (age >= 3600) { o.edge.note = 'Age 3600 = max-age'; o.edge.tone = 'warn'; }
          o.phone.st = t > 1.9 ? 'loading' : 'blank'; const e = run(o, t, 2.0, [L_GET]);
          if (t > e[0]) { o.edge.lit = 1; T(o, ...EDGE_T, 'cópia vencida (stale)\nETag "gato-v1"', 'warn'); } } },
      { id: 'ask', dur: 3.5, title: 'Pergunta à origem: mudou?',
        story: 'Em vez de baixar os 120 KB de novo, o edge manda à origem GET /gato.jpg com If-None-Match: "gato-v1", que quer dizer: "só me mande a foto se a versão não for essa". A pergunta é pequena, mas ainda faz a viagem até São Paulo.',
        look: 'O GET com If-None-Match corre até a origem, que compara o ETag.',
        key: 'If-None-Match leva o ETag da cópia para a origem conferir.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 3600, st: 'stale' }); o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → edge', h: GET };
          o.edge.lit = 1; o.edge.note = 'vencida: perguntando'; o.edge.tone = 'warn';
          const e = run(o, t, 0.3, [leg('eo', false, 'GET · If-None-Match', 'edge → origem', [...GET, 'If-None-Match: "gato-v1"'])]);
          if (t > e[0]) { o.orig.reqs = 2; o.orig.lit = 1; o.orig.note = 'compara: "gato-v1" = "gato-v1"'; T(o, ...ORIG_T, 'ETag igual:\na foto não mudou', 'acc'); } } },
      { id: '304', dur: 4.5, title: '304 Not Modified: vale mais 1 hora',
        story: 'O ETag da foto na origem ainda é "gato-v1". Ela responde 304 Not Modified, só com cabeçalhos e nenhum byte de foto. O edge renova a cópia (Age volta a 0, vale mais 3600 s) e entrega a foto à Lena. Foram uns 55 ms, como no MISS, mas da origem vieram só os cabeçalhos em vez de 120 KB.',
        look: 'Volta um 304 sem a foto; a gaveta zera a idade e o celular mostra o gato.',
        key: 'Revalidar paga a viagem, mas não o download: o 304 não traz corpo.',
        f(o, t) { o.orig.reqs = 2; o.phone.st = 'loading'; o.ms = 27.5; o.msg = { who: 'edge → origem', h: [...GET, 'If-None-Match: "gato-v1"'] };
          const e = run(o, t, 0.3, [leg('eo', true, '304 · 0 KB de foto', 'origem → edge', ['HTTP/1.1 304 Not Modified', CC, 'ETag: "gato-v1"', '(sem corpo: 0 bytes de foto)']), L_OUT('REVALIDATED', 0)]);
          if (t > e[0]) { slot(o, { age: 0, st: 'reval' }); o.edge.lit = 1; o.edge.note = 'renovada: Age 0'; o.edge.tone = 'acc'; xc(o, 'REVALIDATED'); }
          else { slot(o, { age: 3600, st: 'stale' }); o.edge.note = 'esperando a resposta'; o.edge.tone = 'warn'; }
          if (t > e[0] && t < e[1]) T(o, ...EDGE_T, '304: a cópia vale\nmais 3600 s', 'acc');
          if (t > e[1]) { photo(o, 1); T(o, ...PHONE_T, 'a foto chegou\n~55 ms · 0 KB da origem', 'acc'); } } },
      { id: 'changed', dur: 5, title: 'Se a foto tivesse mudado',
        story: 'Se a loja tivesse trocado a foto, o ETag em São Paulo seria "gato-v2" e não bateria com o do edge. A origem responderia 200 OK com os 120 KB novos, o edge trocaria a cópia e a Lena veria o gato com laço. Esse download só acontece quando a foto mudou de verdade.',
        look: 'A origem mostra "gato-v2", volta um 200 com a foto nova e a gaveta troca de gato.',
        key: 'ETag diferente: 200 com o corpo novo. ETag igual: 304 sem corpo.',
        f(o, t) { o.orig.reqs = 1; o.orig.ver = 2; o.phone.st = t > 0.2 ? 'loading' : 'blank';
          const e = run(o, t, 0.3, [L_GET, leg('eo', false, 'GET · If-None-Match', 'edge → origem', [...GET, 'If-None-Match: "gato-v1"']), L_200(2), L_OUT('MISS', 0, 2, 'warn')]);
          if (t > e[1]) { o.orig.reqs = 2; o.orig.lit = 1; o.orig.note = 'compara: "gato-v1" ≠ "gato-v2"'; }
          if (t > e[1] && t < e[2]) T(o, ...ORIG_T, 'ETag diferente:\nmanda a foto nova', 'acc');
          if (t > e[2]) { slot(o, { ver: 2, st: 'new' }); o.edge.lit = 1; o.edge.note = 'trocou pela v2'; o.edge.tone = 'acc'; xc(o, 'MISS', 'warn'); }
          else { slot(o, { age: 3600, st: 'stale' }); if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'vencida: perguntando'; o.edge.tone = 'warn'; } }
          if (t > e[3]) { photo(o, 2); T(o, ...PHONE_T, 'gato com laço\n~55 ms · 120 KB novos', 'acc'); } } },
      { id: 'down', dur: 7, title: 'E se der errado: a origem cai na hora de perguntar',
        story: 'A cópia venceu e São Paulo não responde. Sem nada que autorize usar uma cópia vencida, o edge devolve 504, e a Lena fica sem o gato mesmo com ele na gaveta. Se a origem tivesse mandado Cache-Control: public, max-age=3600, stale-if-error=86400, o edge poderia entregar a cópia vencida por até 1 dia enquanto a origem estivesse com erro.',
        look: 'A origem fica vermelha e o celular mostra 504; depois, com stale-if-error, o mesmo pedido recebe o gato v1 marcado como STALE.',
        key: 'stale-if-error deixa a cópia vencida cobrir a origem fora do ar.',
        f(o, t) { o.orig.reqs = 1; o.orig.down = true; slot(o, { age: 3600, st: 'stale' }); o.phone.st = t > 0.2 ? 'loading' : 'blank';
          const plan = t < 3.6;   // 1ª metade: sem stale-if-error; 2ª: com
          if (plan) {
            const e = run(o, t, 0.3, [L_GET, leg('eo', false, 'GET · If-None-Match', 'edge → origem', [...GET, 'If-None-Match: "gato-v1"'])]);
            if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'vencida: perguntando'; o.edge.tone = 'warn'; }
            if (t > e[1]) { o.bad.eo = true; T(o, ...ORIG_T, 'fora do ar\nnão responde', 'bad'); }
            const e2 = run(o, t, e[1] + 0.5, [leg('le', true, '504 Gateway Timeout', 'edge → Lena', R504, 'bad', 0)]);
            if (t > e[1] + 0.5) { o.edge.note = 'sem permissão: 504'; o.edge.tone = 'bad'; xc(o, '504', 'bad'); o.msTone = 'bad'; }
            if (t > e2[0]) { o.phone.st = 'err'; o.ms = -1; T(o, ...PHONE_T, '504: sem foto\ncom o gato na gaveta', 'bad'); }
          } else {
            const u = t - 3.6; o.bad.eo = true; o.edge.lit = 1; o.edge.note = 'stale-if-error: usa a cópia'; o.edge.tone = 'warn'; o.edge.sie = true;
            const H = ['HTTP/1.1 200 OK', 'Cache-Control: public, max-age=3600, stale-if-error=86400', 'ETag: "gato-v1"', 'Age: 3600', 'X-Cache: STALE'];
            o.ms = 2.5; o.msg = { who: 'edge → Lena', h: H }; xc(o, 'STALE', 'warn');
            const e = run(o, u, 0.6, [leg('le', true, '200 · STALE', 'edge → Lena', H, 'warn')]);
            if (u <= e[0]) T(o, ...EDGE_T, 'com stale-if-error=86400:\nusa a cópia vencida', 'warn');
            if (u > e[0]) { photo(o, 1, 'stale'); T(o, ...PHONE_T, 'gato v1 (vencido)\nmelhor que 504', 'warn'); }
          } } },
    ],
    lab: [
      { id: 'key', dur: 4, title: 'O proxy do laboratório: a chave é um sha1',
        code: 'cachePath := filepath.Join(cacheDir,\n  generateHash(fmt.Sprintf("%s%s%s",\n    r.Method, r.URL.Path, r.URL.RawQuery)))',
        story: 'No laboratório, a CDN é um programa em Go de umas 80 linhas, ouvindo na porta 8080 entre a Lena e a origem. Para cada pedido, ele junta método, caminho e query: "GET" + "/gato.jpg" + "" vira "GET/gato.jpg". O sha1 desse texto vira o nome de um arquivo na pasta cache/.',
        look: 'O edge virou o proxy :8080 e mostra a conta: sha1("GET/gato.jpg") = f34b…3ffa.',
        key: 'A chave do cache é o nome do arquivo: mesmo pedido, mesmo arquivo.',
        f(o, t) { o.phone.st = t > 0.3 ? 'loading' : 'blank'; const e = run(o, t, 0.4, [L_GET]);
          if (t > e[0]) { o.edge.lit = 1; o.edge.math = t > e[0] + 0.4 ? 2 : 1; o.edge.note = 'calculando a chave'; o.edge.tone = 'acc';
            o.log = [`chave = "GET" + "/gato.jpg" + ""`, `sha1("GET/gato.jpg")`, `= ${KEY1}`]; }
          if (t > e[0] + 0.4) T(o, ...EDGE_T, 'arquivo: cache/' + short(KEY1), 'acc'); } },
      { id: 'miss', dur: 5, title: 'Arquivo não existe: busca e grava',
        code: '_, err := os.Stat(cachePath)\nif os.IsNotExist(err) {\n  resp, err := http.Get(url)\n  body, err = ioutil.ReadAll(resp.Body)\n  err = ioutil.WriteFile(cachePath, body, 0644)\n}',
        story: 'O proxy faz os.Stat no caminho cache/f34b…3ffa e o arquivo não existe: é miss. Ele faz http.Get na origem, lê o corpo inteiro (os 120 KB) e grava no disco com ioutil.WriteFile. Só então escreve a foto na resposta. Repare no que não foi guardado: nenhum cabeçalho, nem o Cache-Control.',
        look: 'O arquivo aparece na pasta cache/ do proxy, com 120 KB e sem prazo nenhum.',
        key: 'Miss no laboratório: busca na origem e grava o corpo num arquivo.',
        f(o, t) { o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → proxy', h: GET }; xc(o, 'miss', 'warn'); o.edge.math = 2;
          o.edge.lit = 1; o.edge.note = 'os.Stat: não existe'; o.edge.tone = 'warn'; o.log = [`Cache miss cache/${KEY1}`];
          const e = run(o, t, 0.4, [L_GETO, L_200(), leg('le', true, '200 · 120 KB', 'proxy → Lena', LABOUT)]);
          if (t > e[0]) { o.orig.reqs = 1; o.orig.lit = 1; o.orig.note = 'pedido 1: GET /gato.jpg'; }
          if (t > e[1]) { slot(o, { file: KEY1, max: null, st: 'new' }); o.edge.note = 'WriteFile: gravou'; o.edge.tone = 'acc'; T(o, ...EDGE_T, 'gravou só o corpo\nsem cabeçalho, sem prazo', 'warn'); }
          if (t > e[2]) photo(o, 1); } },
      { id: 'hit', dur: 3.5, title: 'Arquivo existe: lê do disco',
        code: '} else {\n  // Cache hit\n  body, err = ioutil.ReadFile(cachePath)\n}\nw.Write(body)',
        story: 'No pedido seguinte, os.Stat acha o arquivo. O proxy faz ioutil.ReadFile e w.Write(body), sem tocar na origem, e o log mostra "Cache hit cache/f34b…3ffa". A foto chega em uns 5 ms.',
        look: 'O pedido para no proxy; a viga até a origem fica apagada.',
        key: 'Hit no laboratório: o arquivo existe, então a origem não é chamada.',
        f(o, t) { o.orig.reqs = 1; slot(o, { file: KEY1, max: null }); o.edge.math = 2; o.phone.st = t > 0.2 ? 'loading' : 'blank';
          const e = run(o, t, 0.3, [L_GET, leg('le', true, '200 · hit', 'proxy → Lena', LABOUT)]);
          if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'os.Stat: existe → hit'; o.edge.tone = 'acc'; xc(o, 'hit'); o.log = [`Cache hit cache/${KEY1}`]; }
          if (t > e[1]) { photo(o, 1); T(o, ...PHONE_T, 'a foto chegou\n~5 ms', 'acc'); T(o, ...ORIG_T, 'origem: nada\nainda 1 pedido', 'dim'); } } },
      { id: 'never', dur: 8, title: 'E se der errado: a foto nova nunca aparece',
        code: '// nenhuma linha olha a idade do arquivo:\n// se existe, é hit, hoje e daqui a um ano\n$ rm cache/f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa',
        story: 'A loja troca a foto do gato em São Paulo. O proxy não tem TTL, não lê max-age e não calcula Age: se o arquivo cache/f34b…3ffa existe, é hit, hoje e daqui a um ano. A foto nova só aparece se alguém apagar o arquivo ou mudar a URL: /gato.jpg?v=2 gera outra chave (442f…6d53) e um miss novo.',
        look: 'A origem tem o gato com laço, mas o proxy continua entregando o arquivo antigo; depois o pedido com ?v=2 cria um segundo arquivo.',
        key: 'Cache sem TTL nem invalidação nunca se corrige sozinho.',
        f(o, t) { o.orig.reqs = 1; o.orig.ver = 2; o.edge.math = 2; o.orig.note = 'foto nova: gato com laço';
          slot(o, { file: KEY1, max: null, st: t < 3.4 ? 'stale' : 'fresh' });
          if (t < 3.4) {
            o.phone.st = t > 0.2 ? 'loading' : 'blank'; T(o, ...ORIG_T, 'foto nova aqui\n(gato com laço)', 'acc');
            const e = run(o, t, 0.3, [L_GET, leg('le', true, '200 · hit (velho)', 'proxy → Lena', LABOUT, 'bad')]);
            if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'existe → hit, para sempre'; o.edge.tone = 'bad'; xc(o, 'hit (velho)', 'bad'); o.log = [`Cache hit cache/${KEY1}`]; }
            if (t > e[1]) { photo(o, 1, 'velha'); o.msTone = 'bad'; T(o, ...PHONE_T, 'gato sem laço\nfoto velha para sempre', 'bad'); }
          } else {
            const u = t - 3.4, G2 = ['GET /gato.jpg?v=2 HTTP/1.1', 'Host: cdn.loja.example'];
            o.phone.st = 'loading';
            const e = run(o, u, 0.2, [leg('le', false, 'GET /gato.jpg?v=2', 'Lena → proxy', G2), leg('eo', false, 'GET /gato.jpg', 'proxy → origem', GET), L_200(2), leg('le', true, '200 · v2', 'proxy → Lena', LABOUT)]);
            if (u > e[0]) { o.edge.lit = 1; o.edge.note = 'chave nova: miss'; o.edge.tone = 'warn'; xc(o, 'miss', 'warn'); o.log = [`sha1("GET/gato.jpgv=2") = ${KEY2}`, `Cache miss cache/${KEY2}`];
              if (u <= e[3]) T(o, ...EDGE_T, '?v=2 → outra chave\ncache/' + short(KEY2), 'acc'); }
            if (u > e[1]) o.orig.reqs = 2;
            if (u > e[2]) { slot(o, { file: KEY2, max: null, ver: 2, st: 'new' }); o.edge.note = 'gravou o 2º arquivo'; o.edge.tone = 'acc'; }
            if (u > e[3]) { photo(o, 2); T(o, ...PHONE_T, 'gato com laço\nURL nova = arquivo novo', 'acc'); }
          } } },
    ],
  };
  const LABOUT = ['HTTP/1.1 200 OK', 'Content-Type: image/jpeg', '(o Go deduz o tipo pelo conteúdo)', '(sem Cache-Control, ETag nem Age:', ' o proxy não repassa cabeçalhos)'];
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }
  const fmtMs = ms => ms < 0 ? 'sem foto' : (Math.round(ms * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: ms < 10 ? 1 : 0 }) + ' ms';

  // ── desenhos nas telas ──
  function frame(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  // o gato da foto: v1 sem laço, v2 com laço
  function cat(x, cx, cy, s, ver, ink, bow) {
    x.save(); x.lineWidth = s * 0.11; x.strokeStyle = ink; x.fillStyle = ink; x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath(); x.ellipse(cx, cy, s, s * 0.85, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(cx - s * 0.86, cy - s * 0.38); x.lineTo(cx - s * 0.7, cy - s * 1.25); x.lineTo(cx - s * 0.25, cy - s * 0.82);
    x.moveTo(cx + s * 0.86, cy - s * 0.38); x.lineTo(cx + s * 0.7, cy - s * 1.25); x.lineTo(cx + s * 0.25, cy - s * 0.82); x.stroke();
    [-1, 1].forEach(k => { x.beginPath(); x.arc(cx + k * s * 0.36, cy - s * 0.12, s * 0.11, 0, Math.PI * 2); x.fill(); });
    x.beginPath(); x.moveTo(cx - s * 0.1, cy + s * 0.15); x.lineTo(cx + s * 0.1, cy + s * 0.15); x.lineTo(cx, cy + s * 0.27); x.closePath(); x.fill();
    x.lineWidth = s * 0.06; [-1, 1].forEach(k => { x.beginPath(); x.moveTo(cx + k * s * 0.3, cy + s * 0.3); x.lineTo(cx + k * s * 1.3, cy + s * 0.2); x.moveTo(cx + k * s * 0.3, cy + s * 0.4); x.lineTo(cx + k * s * 1.25, cy + s * 0.52); x.stroke(); });
    if (ver > 1) { x.fillStyle = bow; const by = cy + s * 1.02; x.beginPath(); x.moveTo(cx, by); x.lineTo(cx - s * 0.62, by - s * 0.32); x.lineTo(cx - s * 0.62, by + s * 0.32); x.closePath();
      x.moveTo(cx, by); x.lineTo(cx + s * 0.62, by - s * 0.32); x.lineTo(cx + s * 0.62, by + s * 0.32); x.closePath(); x.fill(); x.beginPath(); x.arc(cx, by, s * 0.13, 0, Math.PI * 2); x.fill(); }
    x.restore();
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  const thm = () => theme + accent.getHex();

  // escreve sem passar da largura w (em unidades): reduz a fonte até caber, sem descer de 7
  function fit(x, u, text, px, y, size, w) { let f = size; x.font = `600 ${u(f)}px ${MONO3}`;
    const tw = x.measureText(text).width; if (tw > u(w)) { f = Math.max(7, f * u(w) / tw); x.font = `600 ${u(f)}px ${MONO3}`; } x.fillText(text, u(px), u(y)); }
  function drawFloor() {
    if (!once('floor', thm())) return;
    const cv = floor, { x, P } = cv, u = v => v * P, C = pal3();
    x.clearRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle';
    x.setLineDash([u(3), u(2.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.9);
    x.beginPath(); x.roundRect(u(4), u(24), u(340), u(150), u(8)); x.stroke();
    x.beginPath(); x.roundRect(u(382), u(10), u(176), u(164), u(8)); x.stroke(); x.setLineDash([]);
    x.fillStyle = C.inkHi; x.font = `600 ${u(10)}px ${MONO3}`; x.textAlign = 'left';
    x.fillText('RECIFE', u(10), u(168)); x.fillText('SÃO PAULO', u(390), u(168));
    cv.tex.needsUpdate = true;
    [[sgLE, ['~5 ms', 'ida e volta']], [sgEO, ['~50 ms', 'ida e volta', '~2 100 km']]].forEach(([cv, L]) => { const { x, P } = cv, u = v => v * P;
      x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'center';
      L.forEach((l, i) => { x.fillStyle = i ? INK() : C.inkHi; x.font = `600 ${u(i ? 7 : 10)}px ${MONO3}`; x.fillText(l, cv.c.width / 2, u([6.5, 15.5, 23.5][i])); });
      cv.tex.needsUpdate = true; });
  }
  function drawPhone(o) {
    const P_ = o.phone; if (!once('ph', JSON.stringify([P_, fmtMs(o.ms), o.msTone]) + thm())) return;
    const cv = phone, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', acc = accC();
    x.fillStyle = light ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle';
    x.strokeStyle = P_.st === 'err' ? BAD() : P_.st === 'photo' ? acc : C.line; x.lineWidth = u(P_.st === 'photo' || P_.st === 'err' ? 1.3 : 0.6); x.strokeRect(u(0.7), u(0.7), cv.c.width - u(1.4), cv.c.height - u(1.4));
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(9.5)}px ${MONO3}`; x.fillText('LENA', u(4), u(8));
    x.textAlign = 'right'; x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('Recife', u(86), u(8.3));
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(3), u(14), u(84), u(11));
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('loja/produto/42', u(6), u(19.8));
    x.fillStyle = light ? '#e8e8e7' : '#0f1011'; x.fillRect(u(3), u(28), u(84), u(50));
    x.textAlign = 'center';
    if (P_.st === 'photo') { const ink = P_.note ? (P_.note === 'stale' ? WARN() : BAD()) : C.inkHi;
      cat(x, u(45), u(48), u(12), P_.ver, ink, light ? '#a61f14' : '#ff5a4a');
      x.fillStyle = ink; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(P_.ver > 1 ? 'gato.jpg · v2' : 'gato.jpg · v1', u(45), u(72)); }
    else if (P_.st === 'err') { x.fillStyle = BAD(); x.font = `600 ${u(20)}px ${MONO3}`; x.fillText('504', u(45), u(48)); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('sem foto', u(45), u(66)); }
    else if (P_.st === 'loading') { x.fillStyle = INK(); x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('carregando…', u(45), u(53)); }
    else { x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('(foto do produto)', u(45), u(53)); }
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('gato de pelúcia', u(4), u(88));
    x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('R$ 89,90', u(4), u(101));
    if (P_.st === 'photo' || P_.st === 'err') { x.textAlign = 'right'; x.fillStyle = toneC(o.msTone); x.font = `600 ${u(9.5)}px ${MONO3}`; x.fillText(o.ms < 0 ? '504' : fmtMs(o.ms), u(87), u(101)); }
    cv.tex.needsUpdate = true; phMat.emissiveIntensity = P_.st === 'photo' ? 0.08 : 0;
  }
  function drawEdge(o) {
    const E = o.edge; if (!once('ed', JSON.stringify(E) + thm())) return;
    const lab = E.lab, acc = accC();
    { const { x, u, C } = frame(edTop, E.lit > 0.5, E.tone === 'bad' && E.lit ? 'bad' : ''); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(lab ? 'PASTA cache/ DO PROXY' : 'GAVETA DO CACHE', u(4), u(7));
      for (let k = 0; k < 2; k++) {
        const y0 = 13 + k * 42, s = E.slots[k];
        if (!s) { if (k === 1 && !lab) continue; if (k === 1 && E.math) continue;
          x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(4), u(y0), u(152), u(38)); x.setLineDash([]);
          x.fillStyle = INK(); x.font = `600 ${u(8.5)}px ${MONO3}`; x.textAlign = 'center'; x.fillText(k === 0 ? 'vazia' : 'livre', u(80), u(y0 + 19)); x.textAlign = 'left'; continue; }
        const tone = s.st === 'stale' ? (lab ? 'bad' : 'warn') : 'acc', col = toneC(tone);
        x.fillStyle = theme === 'light' ? '#fbfbfa' : '#17181a'; x.fillRect(u(4), u(y0), u(152), u(38));
        x.strokeStyle = col; x.lineWidth = u(s.st === 'new' || s.st === 'reval' ? 1.5 : 1); x.strokeRect(u(4), u(y0), u(152), u(38));
        cat(x, u(16), u(y0 + 21), u(7.5), s.ver, C.inkHi, theme === 'light' ? '#a61f14' : '#ff5a4a');
        x.fillStyle = C.inkHi; fit(x, u, lab ? 'cache/' + short(s.file) : s.name, 30, y0 + 8, lab ? 9.5 : 10.5, 92);
        x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.textAlign = 'right'; x.fillText('120 KB', u(153), u(y0 + 8.4)); x.textAlign = 'left';
        if (lab) {
          x.fillStyle = col; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText(s.ver > 1 ? 'foto v2 · sem TTL' : 'foto v1 · sem TTL', u(30), u(y0 + 20));
          x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('sem Age, sem max-age', u(30), u(y0 + 31));
        } else {
          x.fillStyle = col; x.font = `600 ${u(9.5)}px ${MONO3}`; x.fillText(`Age ${s.age} de ${s.max}`, u(30), u(y0 + 19));
          x.fillStyle = C.line; x.fillRect(u(30), u(y0 + 25.5), u(122), u(1.6)); x.fillStyle = col; x.fillRect(u(30), u(y0 + 25.5), u(122 * Math.min(1, s.age / s.max)), u(1.6));
          x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(`ETag "gato-v${s.ver}"`, u(30), u(y0 + 32));
          x.textAlign = 'right'; x.fillStyle = col; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(s.st === 'stale' ? 'vencida' : s.st === 'reval' ? 'renovada' : 'fresca', u(153), u(y0 + 32)); x.textAlign = 'left';
        }
      }
      if (lab && E.math && E.slots.length < 2) {
        x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('sha1("GET/gato.jpg") =', u(4), u(62));
        if (E.math > 1) { x.fillStyle = acc; x.font = `600 ${u(8.6)}px ${MONO3}`; x.fillText(KEY1.slice(0, 20), u(4), u(74)); x.fillText(KEY1.slice(20), u(4), u(85)); }
      }
      if (E.note) { x.fillStyle = toneC(E.tone); x.textAlign = 'center'; fit(x, u, E.note, 80, 110, 10.5, 150); }
      edTop.tex.needsUpdate = true; }
    { const cv = edFr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = E.lit > 0.5 ? acc : C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText(lab ? 'PROXY :8080' : 'EDGE · RECIFE', u(4), u(7.5));
      x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText(lab ? 'a CDN do laboratório (Go)' : 'a cópia perto da Lena', u(4), u(17.4));
      cv.tex.needsUpdate = true; }
    edMat.emissiveIntensity = E.lit > 0.5 ? 0.06 : 0;
  }
  function drawOrig(o) {
    const O = o.orig; if (!once('or', JSON.stringify(O) + thm())) return;
    const acc = accC();
    { const { x, u, C } = frame(orTop, O.lit > 0.5 && !O.down, O.down ? 'bad' : ''); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('SERVIDOR DA LOJA', u(4), u(7));
      if (O.down) { x.textAlign = 'center'; x.fillStyle = BAD(); x.font = `600 ${u(17)}px ${MONO3}`; x.fillText('FORA DO AR', u(79), u(42)); x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('não responde', u(79), u(62)); x.textAlign = 'left'; }
      else {
        x.fillStyle = theme === 'light' ? '#fbfbfa' : '#17181a'; x.fillRect(u(4), u(13), u(150), u(42)); x.strokeStyle = O.ver > 1 ? acc : C.line; x.lineWidth = u(O.ver > 1 ? 1.4 : 0.6); x.strokeRect(u(4), u(13), u(150), u(42));
        cat(x, u(19), u(35), u(9), O.ver, C.inkHi, theme === 'light' ? '#a61f14' : '#ff5a4a');
        x.fillStyle = C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText('gato.jpg', u(36), u(22));
        x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.textAlign = 'right'; x.fillText('120 KB', u(151), u(22.4)); x.textAlign = 'left';
        x.fillStyle = O.ver > 1 ? acc : C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(`ETag "gato-v${O.ver}"`, u(36), u(35));
        x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(O.ver > 1 ? 'foto nova (com laço)' : 'a foto original', u(36), u(47));
        x.fillStyle = C.inkHi; x.font = `600 ${u(8.6)}px ${MONO3}`; x.fillText('Cache-Control: public,', u(4), u(66)); x.fillText('  max-age=3600', u(4), u(77));
      }
      x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('pedidos que chegaram:', u(4), u(96));
      x.textAlign = 'right'; x.fillStyle = O.down ? BAD() : acc; x.font = `600 ${u(18)}px ${MONO3}`; x.fillText(String(O.reqs), u(153), u(96)); x.textAlign = 'left';
      if (O.note && !O.down) { x.fillStyle = C.inkHi; fit(x, u, O.note, 4, 118, 8.6, 150); }
      orTop.tex.needsUpdate = true; }
    { const cv = orFr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = O.down ? BAD() : O.lit > 0.5 ? acc : C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText('ORIGEM · SÃO PAULO', u(4), u(9));
      x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(O.down ? 'fora do ar' : 'onde a foto nasce', u(4), u(21));
      cv.tex.needsUpdate = true; }
    orMat.emissiveIntensity = O.down ? 0 : O.lit > 0.5 ? 0.06 : 0;
  }
  function drawScreen(o) {
    const key = JSON.stringify([fmtMs(o.ms), o.msTone, o.xc, o.xcTone, o.msg, o.log, o.orig.reqs, sc]) + thm(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('TEMPO ATÉ A FOTO', u(6), u(9));
    x.fillStyle = toneC(o.msTone); x.font = `600 ${u(o.ms < 0 ? 22 : 30)}px ${MONO3}`; x.fillText(fmtMs(o.ms), u(6), u(32));
    x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText(sc === 'lab' ? 'O LOG DO PROXY DIZ' : 'X-CACHE', u(6), u(55));
    x.fillStyle = toneC(o.xcTone); fit(x, u, o.xc, 6, 68, 14, 160);
    x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(`pedidos na origem: ${o.orig.reqs}`, u(6), u(85));
    const L0 = 186;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(L0 - 9), u(5)); x.lineTo(u(L0 - 9), u(89)); x.stroke();
    let y = 9;
    if (o.log) { x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('LOG DO PROXY', u(L0), u(y)); y += 12;
      x.fillStyle = acc; o.log.slice(0, 3).forEach(l => { fit(x, u, l, L0, y, 8.6, 348); y += 11; }); y += 3; }
    x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('ÚLTIMA MENSAGEM' + (o.msg ? ' · ' + o.msg.who.toUpperCase() : ''), u(L0), u(y)); y += 12.5;
    const lines = o.msg ? o.msg.h : ['(nenhuma ainda)'], room = Math.floor((92 - y) / 11.8) + 1;
    lines.slice(0, room).forEach((l, i) => { x.fillStyle = i === 0 ? acc : l.startsWith('(') || l.startsWith(' ') ? INK() : C.inkHi; fit(x, u, l, L0, y + i * 11.8, i === 0 ? 10 : 9, 348); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Recife, São Paulo, 120 KB, 5 ms e 50 ms são o exemplo do módulo. O domínio cdn.loja.example e o ETag "gato-v1" são inventados. X-Cache não é cabeçalho padrão: cada CDN tem o seu nome (X-Cache, CF-Cache-Status…) e os seus valores.</li>';
  const tl = (rows, on = -1) => `<table class="h3-sum"><tr><th>trecho</th><th>leva</th><th>ms</th></tr>${rows.map((r, i) => `<tr${i === on ? ' class="on"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
  const DATA = {
    miss: () => tl([['Lena → edge', 'GET /gato.jpg', '2,5'], ['edge → origem', 'GET /gato.jpg', '25'], ['origem → edge', '200 · 120 KB', '25'], ['edge → Lena', '200 · X-Cache: MISS', '2,5'], ['total', '', '~55']], 4) +
      '<li>Resposta da origem: <b>Cache-Control: public, max-age=3600</b> (pode guardar por 1 hora) e <b>Content-Length: 122880</b> (120 KB).</li><li>O edge mais perto é escolhido pela CDN (por DNS ou anycast), não pelo navegador.</li><li>Recife → São Paulo: ~2 100 km em linha reta.</li><li>504 Gateway Timeout: o edge esperou a origem e desistiu.</li>' + EX,
    hit: () => `<table class="h3-sum"><tr><th>acesso</th><th>X-Cache</th><th>Age</th><th>ms</th><th>origem</th></tr><tr><td>1º</td><td>MISS</td><td>0</td><td>~55</td><td>+1 pedido</td></tr><tr class="on"><td>2º</td><td>HIT</td><td>12</td><td>~5</td><td>nada</td></tr></table>` +
      '<li><b>Age</b>: há quantos segundos a cópia saiu da origem. Fresca enquanto Age &lt; max-age (12 &lt; 3600).</li><li>~55 ms ÷ ~5 ms = <b>11 vezes</b> mais rápido.</li><li>Foto mudou na origem: o edge só descobre quando o max-age vence. Para antes disso: <b>purgar</b> a URL no edge ou <b>mudar o nome</b> (gato.v2.jpg).</li>' + EX,
    expire: () => `<table class="h3-sum"><tr><th>ETag na origem</th><th>resposta</th><th>corpo</th></tr><tr class="on"><td>"gato-v1" (igual)</td><td>304 Not Modified</td><td>0 bytes</td></tr><tr><td>"gato-v2" (outro)</td><td>200 OK</td><td>120 KB</td></tr></table>` +
      '<li>O edge pergunta com <b>If-None-Match: "gato-v1"</b>. A outra forma é Last-Modified + If-Modified-Since, por data.</li><li>Depois do 304, a cópia volta a <b>Age 0</b> e vale mais <b>3600 s</b>.</li><li><b>stale-if-error=86400</b> (RFC 5861): a origem autoriza usar a cópia vencida por até 1 dia se ela falhar.</li><li>REVALIDATED e STALE seguem os nomes de uma CDN popular; outras dizem RefreshHit ou parecido.</li>' + EX,
    lab: () => `<li><b>GET /gato.jpg</b> → chave "GET/gato.jpg" → arquivo cache/<b>${KEY1}</b></li><li><b>GET /gato.jpg?v=2</b> → chave "GET/gato.jpgv=2" → arquivo cache/<b>${KEY2}</b></li>` +
      '<li>Chave: <b>sha1(método + path + query)</b>, em hex, vira o nome do arquivo.</li><li>Para a origem vai só o path: <b>?v=2 muda a chave</b>, mas a origem recebe /gato.jpg e manda a foto atual.</li><li>Não guarda status nem cabeçalhos: um 404 ou um 500 da origem também viraria arquivo e seria servido para sempre.</li><li>No repositório a origem é https://uol.com.br; aqui, para seguir a história, é a loja.</li><li class="h3-dim">Código: cdn/main.go, nos exemplos de cache do repositório público do autor do blog (github.com/msfidelis).</li>',
  };
  function countHtml() { const o = SP || spec(); return `<b${o.msTone === 'bad' ? ' class="bad"' : ''}>${fmtMs(o.ms)}</b><span>até a foto aparecer</span><i>· ${sc === 'lab' ? 'log' : 'X-Cache'}: ${o.xc} · origem: ${o.orig.reqs} ${o.orig.reqs === 1 ? 'pedido' : 'pedidos'}</i>`; }
  function msgHtml() { const o = SP || spec(), s = cur();
    if (sc === 'lab') return `<b>Código · cdn/main.go</b>${s.code.replace(/</g, '&lt;')}`;
    return `<b>Cabeçalhos HTTP · ${o.msg ? o.msg.who : 'nenhum ainda'}</b>${(o.msg ? o.msg.h : ['(o pedido ainda não saiu)']).join('\n').replace(/</g, '&lt;')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário da CDN">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="c3count" aria-live="off">${countHtml()}</div>
      <div class="i3-sql" id="c3msg">${msgHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cdn') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${fmtMs(o.ms)} · ${o.xc}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'cdn' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; msgKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; for (const k in ckey) delete ckey[k]; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-cdn3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'cdn') setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec();
    const beams = ['le', 'eo'].map(r => ({ pts: R[r], on: !!o.on[r], back: o.on[r] === 'back', dots: !!o.on[r], bad: !!o.bad[r] && !o.on[r] }));
    setBeams(beams);
    if (o.pk) { const pts = R[o.pk.r], p = alongPts(pts, cumLen(pts), o.pk.f), q = [p[0], p[1], p[2] + 2];
      pkG.visible = true; pkG.position.copy(W(...q)); moveGlow(pkGlow, [q[0], q[1], q[2] + 14], o.pk.tone === 'bad' ? 0.3 : 0.9);
      pkMat.emissive.set(o.pk.tone === 'bad' ? 0xff5a4a : o.pk.tone === 'warn' ? 0xffb02e : accent); PKT.set(o.pk.text, o.pk.tone).at(q[0], q[1], q[2] + 34); }
    else { pkG.visible = false; pkGlow.material.uniforms.intensity.value = 0; PKT.hide(); }
    drawFloor(); drawPhone(o); drawEdge(o); drawOrig(o); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) { lt = 0; for (const k in ckey) delete ckey[k]; }
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('c3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const em = document.getElementById('c3msg'), m = msgHtml(); if (em && m !== msgKey) { msgKey = m; em.innerHTML = m; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [8, PW - 8, 6, PD - 4];
      const nar = NARROW(), asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = 500 / innerWidth;
      const aW = nar ? 1.02 : 0.97 - side, aH = nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 70) / 100 * 1.04 / (2 * tn * aH));
      const fx = nar ? 0.55 : side + aW / 2, fy = nar ? 0.07 + aH * 0.6 : 0.52;
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
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (a média fica em gama, como a tela reduz texto).
  const CANV = () => [scr, floor, phone, edTop, edFr, orTop, orFr, sgLE, sgEO];
  const GAM = { value: 0 };
  CANV().forEach(cv => { cv.mesh.material.onBeforeCompile = sh => { sh.uniforms.uGam = GAM;
    sh.fragmentShader = 'uniform float uGam;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
      vec4 sampledDiffuseColor = texture2D( map, vMapUv );
      if ( uGam > 0.5 ) sampledDiffuseColor.rgb = mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) );
      diffuseColor *= sampledDiffuseColor;
    #endif`); }; cv.mesh.material.needsUpdate = true; });
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k];
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(290, 150, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 165, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1 2 3 4 · arraste para girar' };
})() });
