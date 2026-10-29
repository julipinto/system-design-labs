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
  const R504 = ['HTTP/1.1 504 Gateway Timeout', 'X-Cache: MISS', '(no photo)'];

  const SC = ['miss', 'hit', 'expire', 'lab'];
  const SCNAME = { miss: 'Miss', hit: 'Hit', expire: 'Expire', lab: 'Lab' };
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
  const L_GETO = leg('eo', false, 'GET /gato.jpg', 'edge → origin', GET);
  const L_200 = (v = 1) => leg('eo', true, `200 OK · 120 KB${v > 1 ? ' (v2)' : ''}`, 'origin → edge', R200(v));
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
      { id: 'ask', dur: 3, title: 'Lena asks for the photo',
        story: 'Lena, in Recife, opens the plush cat page (product 42). The browser asks for the photo gato.jpg, 120 KB. The request does not go straight to São Paulo: the CDN hands it to its server closest to Lena, the Recife edge.',
        look: 'The GET packet leaves the phone and reaches the edge. The edge cache drawer is empty.',
        key: 'Whoever uses a CDN talks to the closest edge, not to the origin.',
        f(o, t) { o.phone.st = t > 0.3 ? 'loading' : 'blank'; const e = run(o, t, 0.4, [L_GET]);
          if (t > e[0]) { o.edge.note = 'looking for gato.jpg…'; o.edge.lit = 1; T(o, ...EDGE_T, 'empty drawer\ngato.jpg? do not have it', 'hi'); } } },
      { id: 'fetch', dur: 4.5, title: 'MISS: the edge goes to São Paulo',
        story: 'The edge looks for gato.jpg in the cache and does not find it: a MISS. So it becomes a client and asks the origin, in São Paulo, about 2,100 km away, for the photo. That round trip alone costs about 50 ms, ten times the path between Lena and the edge.',
        look: 'The edge drawer says MISS, the GET runs to the origin and comes back as 200 OK with the 120 KB.',
        key: 'MISS: the copy is not at the edge, and someone pays for the trip to the origin.',
        f(o, t) { o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → edge', h: GET }; xc(o, 'MISS', 'warn'); o.edge.note = 'MISS: fetching from the origin'; o.edge.tone = 'warn'; o.edge.lit = 1;
          const e = run(o, t, 0.3, [L_GETO, L_200()]);
          if (t > e[0]) { o.orig.reqs = 1; o.orig.lit = 1; o.orig.note = 'request 1: GET /gato.jpg'; }
          if (t > e[1]) T(o, ...EDGE_T, 'arrived from the origin:\n120 KB · max-age=3600', 'acc'); } },
      { id: 'store', dur: 4, title: 'Stores the copy and delivers',
        story: 'The origin response carries Cache-Control: public, max-age=3600: any cache may keep the photo for 3600 s, 1 hour. The edge writes the copy into the drawer and delivers the photo to Lena with X-Cache: MISS and Age: 0. From request to photo: about 55 ms.',
        look: 'The photo goes into the edge drawer with Age 0 of 3600 and shows up on the phone; the display stops at 55 ms.',
        key: 'max-age says how long the copy is good for without asking the origin.',
        f(o, t) { o.phone.st = 'loading'; o.ms = 52.5; o.msg = { who: 'origin → edge', h: R200() }; xc(o, 'MISS', 'warn'); o.orig.reqs = 1;
          if (t > 0.3) { slot(o, { st: 'new' }); o.edge.note = 'stored: good for 3600 s'; o.edge.tone = 'acc'; o.edge.lit = t < 1.4 ? 1 : 0.3; }
          const e = run(o, t, 1.2, [L_OUT('MISS', 0, 1, 'warn')]);
          if (t > e[0]) { photo(o, 1); T(o, ...PHONE_T, 'the photo arrived\n~55 ms', 'acc'); } } },
      { id: 'down', dur: 6, title: 'What if it goes wrong: the origin is down',
        story: 'Go back to the start, with an empty drawer, but now the origin is down. The edge asks for the photo, waits and gives up: with no copy at all, it returns 504 Gateway Timeout and the page opens for Lena without the cat photo. On the first access, the CDN has nothing to show.',
        look: 'The origin turns red, the GET does not come back and the phone shows the 504 error.',
        key: 'On a MISS, the CDN can only deliver what the origin manages to deliver.',
        f(o, t) { o.orig.down = true; o.phone.st = 'loading'; const e = run(o, t, 0.3, [L_GET, L_GETO]);
          if (t > e[0]) { xc(o, 'MISS', 'warn'); o.edge.note = 'MISS: fetching from the origin'; o.edge.tone = 'warn'; o.edge.lit = 1; }
          if (t > e[1]) { o.bad.eo = true; o.edge.note = 'waiting for the origin…'; o.msTone = 'bad'; o.ms = 27.5; T(o, ...ORIG_T, 'down\nnot responding', 'bad'); }
          if (t > e[1] + 1.6) { o.edge.note = 'gave up: 504'; o.edge.tone = 'bad'; xc(o, '504', 'bad'); o.msg = { who: 'edge → Lena', h: R504 }; }
          const e2 = run(o, t, e[1] + 1.6, [leg('le', true, '504 Gateway Timeout', 'edge → Lena', R504, 'bad', 0)]);
          if (t > e2[0]) { o.phone.st = 'err'; o.ms = -1; T(o, ...PHONE_T, '504: no photo\nthere is no copy at all', 'bad'); } } },
    ],
    hit: [
      { id: 'again', dur: 3, title: 'Second access: the copy is there',
        story: '12 seconds later, Lena reloads the page (it could be anyone in Recife). The request reaches the same edge, which now has gato.jpg in the drawer, stored 12 s ago.',
        look: 'The GET reaches the edge; the drawer shows gato.jpg with Age 12 of 3600.',
        key: 'The edge copy serves everyone who goes through it, not just whoever asked first.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 12 }); o.phone.st = t > 0.3 ? 'loading' : 'blank'; const e = run(o, t, 0.4, [L_GET]);
          if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'have it: Age 12 of 3600'; o.edge.tone = 'acc'; T(o, ...EDGE_T, 'gato.jpg in the drawer\nstored 12 s ago', 'acc'); } } },
      { id: 'serve', dur: 3.5, title: 'HIT: responds without going to São Paulo',
        story: 'The edge checks the age: 12 s of 3600, the copy is fresh. It answers right from there, with X-Cache: HIT and Age: 12. The photo shows up in about 5 ms, 11 times faster than on the first access, and the origin never finds out.',
        look: 'The 200 goes back from the edge to the phone; the beam to São Paulo stays dark and the origin still has 1 request.',
        key: 'HIT: Age below max-age, and the response comes from the edge.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 12 }); o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → edge', h: GET }; xc(o, 'HIT');
          o.edge.lit = 1; o.edge.note = 'HIT: 12 < 3600, fresh'; o.edge.tone = 'acc';
          const e = run(o, t, 0.4, [L_OUT('HIT', 12)]);
          if (t > e[0]) { photo(o, 1); T(o, ...PHONE_T, 'the photo arrived\n~5 ms (before: ~55)', 'acc'); T(o, ...ORIG_T, 'origin: nothing\nstill 1 request', 'dim'); } } },
      { id: 'stale', dur: 6, title: 'What if it goes wrong: the photo changed at the origin',
        story: 'The store swaps the photo for one of the cat with a bow and uploads the new gato.jpg in São Paulo, with the same name. The edge does not find out: its copy is still valid (Age 12 of 3600), so it keeps delivering the cat without a bow as a HIT for up to 1 hour. For the new photo to show up sooner, you have to purge gato.jpg at the edge or change the file name (gato.v2.jpg).',
        look: 'The origin shows the cat with a bow ("gato-v2"); the phone receives the old cat, marked as HIT.',
        key: 'While max-age has not expired, the edge asks the origin nothing.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 12 }); o.orig.ver = t > 0.3 ? 2 : 1;
          if (t > 0.3) { o.orig.lit = 1; o.orig.note = 'new photo: "gato-v2"'; T(o, ...ORIG_T, 'new photo here\nETag "gato-v2"', 'acc'); }
          o.phone.st = t > 1.4 ? 'loading' : 'blank'; const e = run(o, t, 1.5, [L_GET, L_OUT('HIT', 12, 1, 'bad')]);
          if (t > e[0]) { xc(o, 'HIT'); o.edge.lit = 1; o.edge.note = 'HIT: 12 < 3600'; o.edge.tone = 'acc'; }
          if (t > e[1]) { photo(o, 1, 'velha'); o.msTone = 'bad'; xc(o, 'HIT (stale)', 'bad'); T(o, ...PHONE_T, 'cat without a bow:\nold photo for up to 1 h', 'bad'); } } },
    ],
    expire: [
      { id: 'aged', dur: 4, title: 'One hour later: the copy expired',
        story: '1 hour has passed since the edge stored the photo. The age of the copy reaches 3600 s, equal to max-age: it stops being fresh (it becomes stale). The edge does not throw the copy away; it keeps the ETag "gato-v1" with it, the label of the version the origin sent. Then a request from Lena arrives.',
        look: 'The age in the drawer runs up to 3600 and the copy is marked as expired; the GET from Lena reaches the edge.',
        key: 'Expired does not mean deleted: it means "ask before using".',
        f(o, t) { o.orig.reqs = 1; const age = Math.round(12 + (3600 - 12) * clamp((t - 0.2) / 1.6) ** 1.5);
          slot(o, { age, st: age >= 3600 ? 'stale' : 'fresh' }); if (age >= 3600) { o.edge.note = 'Age 3600 = max-age'; o.edge.tone = 'warn'; }
          o.phone.st = t > 1.9 ? 'loading' : 'blank'; const e = run(o, t, 2.0, [L_GET]);
          if (t > e[0]) { o.edge.lit = 1; T(o, ...EDGE_T, 'expired copy (stale)\nETag "gato-v1"', 'warn'); } } },
      { id: 'ask', dur: 3.5, title: 'Asks the origin: did it change?',
        story: 'Instead of downloading the 120 KB again, the edge sends the origin GET /gato.jpg with If-None-Match: "gato-v1", which means: "only send me the photo if the version is not this one". The question is small, but it still makes the trip to São Paulo.',
        look: 'The GET with If-None-Match runs to the origin, which compares the ETag.',
        key: 'If-None-Match carries the ETag of the copy to the origin to check.',
        f(o, t) { o.orig.reqs = 1; slot(o, { age: 3600, st: 'stale' }); o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → edge', h: GET };
          o.edge.lit = 1; o.edge.note = 'expired: asking'; o.edge.tone = 'warn';
          const e = run(o, t, 0.3, [leg('eo', false, 'GET · If-None-Match', 'edge → origin', [...GET, 'If-None-Match: "gato-v1"'])]);
          if (t > e[0]) { o.orig.reqs = 2; o.orig.lit = 1; o.orig.note = 'compares: "gato-v1" = "gato-v1"'; T(o, ...ORIG_T, 'same ETag:\nthe photo did not change', 'acc'); } } },
      { id: '304', dur: 4.5, title: '304 Not Modified: good for another hour',
        story: 'The photo ETag at the origin is still "gato-v1". It answers 304 Not Modified, with headers only and not a single byte of photo. The edge renews the copy (Age goes back to 0, good for another 3600 s) and delivers the photo to Lena. It took about 55 ms, like the MISS, but only headers came from the origin instead of 120 KB.',
        look: 'A 304 comes back without the photo; the drawer resets the age and the phone shows the cat.',
        key: 'Revalidating pays for the trip, but not for the download: the 304 has no body.',
        f(o, t) { o.orig.reqs = 2; o.phone.st = 'loading'; o.ms = 27.5; o.msg = { who: 'edge → origin', h: [...GET, 'If-None-Match: "gato-v1"'] };
          const e = run(o, t, 0.3, [leg('eo', true, '304 · 0 KB of photo', 'origin → edge', ['HTTP/1.1 304 Not Modified', CC, 'ETag: "gato-v1"', '(no body: 0 bytes of photo)']), L_OUT('REVALIDATED', 0)]);
          if (t > e[0]) { slot(o, { age: 0, st: 'reval' }); o.edge.lit = 1; o.edge.note = 'renewed: Age 0'; o.edge.tone = 'acc'; xc(o, 'REVALIDATED'); }
          else { slot(o, { age: 3600, st: 'stale' }); o.edge.note = 'waiting for the response'; o.edge.tone = 'warn'; }
          if (t > e[0] && t < e[1]) T(o, ...EDGE_T, '304: the copy is good\nfor another 3600 s', 'acc');
          if (t > e[1]) { photo(o, 1); T(o, ...PHONE_T, 'the photo arrived\n~55 ms · 0 KB from the origin', 'acc'); } } },
      { id: 'changed', dur: 5, title: 'If the photo had changed',
        story: 'If the store had swapped the photo, the ETag in São Paulo would be "gato-v2" and would not match the one at the edge. The origin would answer 200 OK with the new 120 KB, the edge would replace the copy and Lena would see the cat with a bow. That download only happens when the photo really changed.',
        look: 'The origin shows "gato-v2", a 200 comes back with the new photo and the drawer swaps cats.',
        key: 'Different ETag: 200 with the new body. Same ETag: 304 without a body.',
        f(o, t) { o.orig.reqs = 1; o.orig.ver = 2; o.phone.st = t > 0.2 ? 'loading' : 'blank';
          const e = run(o, t, 0.3, [L_GET, leg('eo', false, 'GET · If-None-Match', 'edge → origin', [...GET, 'If-None-Match: "gato-v1"']), L_200(2), L_OUT('MISS', 0, 2, 'warn')]);
          if (t > e[1]) { o.orig.reqs = 2; o.orig.lit = 1; o.orig.note = 'compares: "gato-v1" ≠ "gato-v2"'; }
          if (t > e[1] && t < e[2]) T(o, ...ORIG_T, 'different ETag:\nsends the new photo', 'acc');
          if (t > e[2]) { slot(o, { ver: 2, st: 'new' }); o.edge.lit = 1; o.edge.note = 'swapped for v2'; o.edge.tone = 'acc'; xc(o, 'MISS', 'warn'); }
          else { slot(o, { age: 3600, st: 'stale' }); if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'expired: asking'; o.edge.tone = 'warn'; } }
          if (t > e[3]) { photo(o, 2); T(o, ...PHONE_T, 'cat with a bow\n~55 ms · 120 KB new', 'acc'); } } },
      { id: 'down', dur: 7, title: 'What if it goes wrong: the origin goes down when asked',
        story: 'The copy expired and São Paulo does not answer. With nothing that allows using an expired copy, the edge returns 504, and Lena is left without the cat even though it is in the drawer. If the origin had sent Cache-Control: public, max-age=3600, stale-if-error=86400, the edge could deliver the expired copy for up to 1 day while the origin is failing.',
        look: 'The origin turns red and the phone shows 504; then, with stale-if-error, the same request gets cat v1 marked as STALE.',
        key: 'stale-if-error lets the expired copy cover for an origin that is down.',
        f(o, t) { o.orig.reqs = 1; o.orig.down = true; slot(o, { age: 3600, st: 'stale' }); o.phone.st = t > 0.2 ? 'loading' : 'blank';
          const plan = t < 3.6;   // 1ª metade: sem stale-if-error; 2ª: com
          if (plan) {
            const e = run(o, t, 0.3, [L_GET, leg('eo', false, 'GET · If-None-Match', 'edge → origin', [...GET, 'If-None-Match: "gato-v1"'])]);
            if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'expired: asking'; o.edge.tone = 'warn'; }
            if (t > e[1]) { o.bad.eo = true; T(o, ...ORIG_T, 'down\nnot responding', 'bad'); }
            const e2 = run(o, t, e[1] + 0.5, [leg('le', true, '504 Gateway Timeout', 'edge → Lena', R504, 'bad', 0)]);
            if (t > e[1] + 0.5) { o.edge.note = 'no permission: 504'; o.edge.tone = 'bad'; xc(o, '504', 'bad'); o.msTone = 'bad'; }
            if (t > e2[0]) { o.phone.st = 'err'; o.ms = -1; T(o, ...PHONE_T, '504: no photo\nwith the cat in the drawer', 'bad'); }
          } else {
            const u = t - 3.6; o.bad.eo = true; o.edge.lit = 1; o.edge.note = 'stale-if-error: uses the copy'; o.edge.tone = 'warn'; o.edge.sie = true;
            const H = ['HTTP/1.1 200 OK', 'Cache-Control: public, max-age=3600, stale-if-error=86400', 'ETag: "gato-v1"', 'Age: 3600', 'X-Cache: STALE'];
            o.ms = 2.5; o.msg = { who: 'edge → Lena', h: H }; xc(o, 'STALE', 'warn');
            const e = run(o, u, 0.6, [leg('le', true, '200 · STALE', 'edge → Lena', H, 'warn')]);
            if (u <= e[0]) T(o, ...EDGE_T, 'with stale-if-error=86400:\nuses the expired copy', 'warn');
            if (u > e[0]) { photo(o, 1, 'stale'); T(o, ...PHONE_T, 'cat v1 (expired)\nbetter than 504', 'warn'); }
          } } },
    ],
    lab: [
      { id: 'key', dur: 4, title: 'The lab proxy: the key is a sha1',
        code: 'cachePath := filepath.Join(cacheDir,\n  generateHash(fmt.Sprintf("%s%s%s",\n    r.Method, r.URL.Path, r.URL.RawQuery)))',
        story: 'In the lab, the CDN is a Go program of about 80 lines, listening on port 8080 between Lena and the origin. For each request, it joins method, path and query: "GET" + "/gato.jpg" + "" becomes "GET/gato.jpg". The sha1 of that text becomes the name of a file in the cache/ folder.',
        look: 'The edge became the :8080 proxy and shows the math: sha1("GET/gato.jpg") = f34b…3ffa.',
        key: 'The cache key is the file name: same request, same file.',
        f(o, t) { o.phone.st = t > 0.3 ? 'loading' : 'blank'; const e = run(o, t, 0.4, [L_GET]);
          if (t > e[0]) { o.edge.lit = 1; o.edge.math = t > e[0] + 0.4 ? 2 : 1; o.edge.note = 'computing the key'; o.edge.tone = 'acc';
            o.log = [`key = "GET" + "/gato.jpg" + ""`, `sha1("GET/gato.jpg")`, `= ${KEY1}`]; }
          if (t > e[0] + 0.4) T(o, ...EDGE_T, 'file: cache/' + short(KEY1), 'acc'); } },
      { id: 'miss', dur: 5, title: 'File does not exist: fetch and write',
        code: '_, err := os.Stat(cachePath)\nif os.IsNotExist(err) {\n  resp, err := http.Get(url)\n  body, err = ioutil.ReadAll(resp.Body)\n  err = ioutil.WriteFile(cachePath, body, 0644)\n}',
        story: 'The proxy runs os.Stat on the path cache/f34b…3ffa and the file does not exist: a miss. It does http.Get to the origin, reads the whole body (the 120 KB) and writes it to disk with ioutil.WriteFile. Only then does it write the photo to the response. Note what was not stored: no header, not even Cache-Control.',
        look: 'The file shows up in the proxy cache/ folder, with 120 KB and no expiry at all.',
        key: 'Miss in the lab: fetch from the origin and write the body to a file.',
        f(o, t) { o.phone.st = 'loading'; o.ms = 2.5; o.msg = { who: 'Lena → proxy', h: GET }; xc(o, 'miss', 'warn'); o.edge.math = 2;
          o.edge.lit = 1; o.edge.note = 'os.Stat: does not exist'; o.edge.tone = 'warn'; o.log = [`Cache miss cache/${KEY1}`];
          const e = run(o, t, 0.4, [L_GETO, L_200(), leg('le', true, '200 · 120 KB', 'proxy → Lena', LABOUT)]);
          if (t > e[0]) { o.orig.reqs = 1; o.orig.lit = 1; o.orig.note = 'request 1: GET /gato.jpg'; }
          if (t > e[1]) { slot(o, { file: KEY1, max: null, st: 'new' }); o.edge.note = 'WriteFile: wrote it'; o.edge.tone = 'acc'; T(o, ...EDGE_T, 'wrote only the body\nno header, no expiry', 'warn'); }
          if (t > e[2]) photo(o, 1); } },
      { id: 'hit', dur: 3.5, title: 'File exists: reads from disk',
        code: '} else {\n  // Cache hit\n  body, err = ioutil.ReadFile(cachePath)\n}\nw.Write(body)',
        story: 'On the next request, os.Stat finds the file. The proxy does ioutil.ReadFile and w.Write(body), without touching the origin, and the log shows "Cache hit cache/f34b…3ffa". The photo arrives in about 5 ms.',
        look: 'The request stops at the proxy; the beam to the origin stays dark.',
        key: 'Hit in the lab: the file exists, so the origin is not called.',
        f(o, t) { o.orig.reqs = 1; slot(o, { file: KEY1, max: null }); o.edge.math = 2; o.phone.st = t > 0.2 ? 'loading' : 'blank';
          const e = run(o, t, 0.3, [L_GET, leg('le', true, '200 · hit', 'proxy → Lena', LABOUT)]);
          if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'os.Stat: exists → hit'; o.edge.tone = 'acc'; xc(o, 'hit'); o.log = [`Cache hit cache/${KEY1}`]; }
          if (t > e[1]) { photo(o, 1); T(o, ...PHONE_T, 'the photo arrived\n~5 ms', 'acc'); T(o, ...ORIG_T, 'origin: nothing\nstill 1 request', 'dim'); } } },
      { id: 'never', dur: 8, title: 'What if it goes wrong: the new photo never shows up',
        code: '// no line looks at the age of the file:\n// if it exists, it is a hit, today and a year from now\n$ rm cache/f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa',
        story: 'The store swaps the cat photo in São Paulo. The proxy has no TTL, does not read max-age and does not compute Age: if the file cache/f34b…3ffa exists, it is a hit, today and a year from now. The new photo only shows up if someone deletes the file or changes the URL: /gato.jpg?v=2 produces another key (442f…6d53) and a new miss.',
        look: 'The origin has the cat with a bow, but the proxy keeps serving the old file; then the request with ?v=2 creates a second file.',
        key: 'A cache with no TTL and no invalidation never fixes itself.',
        f(o, t) { o.orig.reqs = 1; o.orig.ver = 2; o.edge.math = 2; o.orig.note = 'new photo: cat with a bow';
          slot(o, { file: KEY1, max: null, st: t < 3.4 ? 'stale' : 'fresh' });
          if (t < 3.4) {
            o.phone.st = t > 0.2 ? 'loading' : 'blank'; T(o, ...ORIG_T, 'new photo here\n(cat with a bow)', 'acc');
            const e = run(o, t, 0.3, [L_GET, leg('le', true, '200 · hit (stale)', 'proxy → Lena', LABOUT, 'bad')]);
            if (t > e[0]) { o.edge.lit = 1; o.edge.note = 'exists → hit, forever'; o.edge.tone = 'bad'; xc(o, 'hit (stale)', 'bad'); o.log = [`Cache hit cache/${KEY1}`]; }
            if (t > e[1]) { photo(o, 1, 'velha'); o.msTone = 'bad'; T(o, ...PHONE_T, 'cat without a bow\nold photo forever', 'bad'); }
          } else {
            const u = t - 3.4, G2 = ['GET /gato.jpg?v=2 HTTP/1.1', 'Host: cdn.loja.example'];
            o.phone.st = 'loading';
            const e = run(o, u, 0.2, [leg('le', false, 'GET /gato.jpg?v=2', 'Lena → proxy', G2), leg('eo', false, 'GET /gato.jpg', 'proxy → origin', GET), L_200(2), leg('le', true, '200 · v2', 'proxy → Lena', LABOUT)]);
            if (u > e[0]) { o.edge.lit = 1; o.edge.note = 'new key: miss'; o.edge.tone = 'warn'; xc(o, 'miss', 'warn'); o.log = [`sha1("GET/gato.jpgv=2") = ${KEY2}`, `Cache miss cache/${KEY2}`];
              if (u <= e[3]) T(o, ...EDGE_T, '?v=2 → another key\ncache/' + short(KEY2), 'acc'); }
            if (u > e[1]) o.orig.reqs = 2;
            if (u > e[2]) { slot(o, { file: KEY2, max: null, ver: 2, st: 'new' }); o.edge.note = 'wrote the 2nd file'; o.edge.tone = 'acc'; }
            if (u > e[3]) { photo(o, 2); T(o, ...PHONE_T, 'cat with a bow\nnew URL = new file', 'acc'); }
          } } },
    ],
  };
  const LABOUT = ['HTTP/1.1 200 OK', 'Content-Type: image/jpeg', '(Go infers the type from the content)', '(no Cache-Control, ETag or Age:', ' the proxy does not forward headers)'];
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }
  const fmtMs = ms => ms < 0 ? 'no photo' : (Math.round(ms * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: ms < 10 ? 1 : 0 }) + ' ms';

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
    [[sgLE, ['~5 ms', 'round trip']], [sgEO, ['~50 ms', 'round trip', '~2,100 km']]].forEach(([cv, L]) => { const { x, P } = cv, u = v => v * P;
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
    else if (P_.st === 'err') { x.fillStyle = BAD(); x.font = `600 ${u(20)}px ${MONO3}`; x.fillText('504', u(45), u(48)); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('no photo', u(45), u(66)); }
    else if (P_.st === 'loading') { x.fillStyle = INK(); x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('loading…', u(45), u(53)); }
    else { x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('(product photo)', u(45), u(53)); }
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('plush cat', u(4), u(88));
    x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('R$ 89.90', u(4), u(101));
    if (P_.st === 'photo' || P_.st === 'err') { x.textAlign = 'right'; x.fillStyle = toneC(o.msTone); x.font = `600 ${u(9.5)}px ${MONO3}`; x.fillText(o.ms < 0 ? '504' : fmtMs(o.ms), u(87), u(101)); }
    cv.tex.needsUpdate = true; phMat.emissiveIntensity = P_.st === 'photo' ? 0.08 : 0;
  }
  function drawEdge(o) {
    const E = o.edge; if (!once('ed', JSON.stringify(E) + thm())) return;
    const lab = E.lab, acc = accC();
    { const { x, u, C } = frame(edTop, E.lit > 0.5, E.tone === 'bad' && E.lit ? 'bad' : ''); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(lab ? 'PROXY cache/ FOLDER' : 'CACHE DRAWER', u(4), u(7));
      for (let k = 0; k < 2; k++) {
        const y0 = 13 + k * 42, s = E.slots[k];
        if (!s) { if (k === 1 && !lab) continue; if (k === 1 && E.math) continue;
          x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(4), u(y0), u(152), u(38)); x.setLineDash([]);
          x.fillStyle = INK(); x.font = `600 ${u(8.5)}px ${MONO3}`; x.textAlign = 'center'; x.fillText(k === 0 ? 'empty' : 'free', u(80), u(y0 + 19)); x.textAlign = 'left'; continue; }
        const tone = s.st === 'stale' ? (lab ? 'bad' : 'warn') : 'acc', col = toneC(tone);
        x.fillStyle = theme === 'light' ? '#fbfbfa' : '#17181a'; x.fillRect(u(4), u(y0), u(152), u(38));
        x.strokeStyle = col; x.lineWidth = u(s.st === 'new' || s.st === 'reval' ? 1.5 : 1); x.strokeRect(u(4), u(y0), u(152), u(38));
        cat(x, u(16), u(y0 + 21), u(7.5), s.ver, C.inkHi, theme === 'light' ? '#a61f14' : '#ff5a4a');
        x.fillStyle = C.inkHi; fit(x, u, lab ? 'cache/' + short(s.file) : s.name, 30, y0 + 8, lab ? 9.5 : 10.5, 92);
        x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.textAlign = 'right'; x.fillText('120 KB', u(153), u(y0 + 8.4)); x.textAlign = 'left';
        if (lab) {
          x.fillStyle = col; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText(s.ver > 1 ? 'photo v2 · no TTL' : 'photo v1 · no TTL', u(30), u(y0 + 20));
          x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('no Age, no max-age', u(30), u(y0 + 31));
        } else {
          x.fillStyle = col; x.font = `600 ${u(9.5)}px ${MONO3}`; x.fillText(`Age ${s.age} of ${s.max}`, u(30), u(y0 + 19));
          x.fillStyle = C.line; x.fillRect(u(30), u(y0 + 25.5), u(122), u(1.6)); x.fillStyle = col; x.fillRect(u(30), u(y0 + 25.5), u(122 * Math.min(1, s.age / s.max)), u(1.6));
          x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(`ETag "gato-v${s.ver}"`, u(30), u(y0 + 32));
          x.textAlign = 'right'; x.fillStyle = col; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(s.st === 'stale' ? 'expired' : s.st === 'reval' ? 'renewed' : 'fresh', u(153), u(y0 + 32)); x.textAlign = 'left';
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
      x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText(lab ? 'the lab CDN (Go)' : 'the copy near Lena', u(4), u(17.4));
      cv.tex.needsUpdate = true; }
    edMat.emissiveIntensity = E.lit > 0.5 ? 0.06 : 0;
  }
  function drawOrig(o) {
    const O = o.orig; if (!once('or', JSON.stringify(O) + thm())) return;
    const acc = accC();
    { const { x, u, C } = frame(orTop, O.lit > 0.5 && !O.down, O.down ? 'bad' : ''); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('STORE SERVER', u(4), u(7));
      if (O.down) { x.textAlign = 'center'; x.fillStyle = BAD(); x.font = `600 ${u(17)}px ${MONO3}`; x.fillText('DOWN', u(79), u(42)); x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('not responding', u(79), u(62)); x.textAlign = 'left'; }
      else {
        x.fillStyle = theme === 'light' ? '#fbfbfa' : '#17181a'; x.fillRect(u(4), u(13), u(150), u(42)); x.strokeStyle = O.ver > 1 ? acc : C.line; x.lineWidth = u(O.ver > 1 ? 1.4 : 0.6); x.strokeRect(u(4), u(13), u(150), u(42));
        cat(x, u(19), u(35), u(9), O.ver, C.inkHi, theme === 'light' ? '#a61f14' : '#ff5a4a');
        x.fillStyle = C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText('gato.jpg', u(36), u(22));
        x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.textAlign = 'right'; x.fillText('120 KB', u(151), u(22.4)); x.textAlign = 'left';
        x.fillStyle = O.ver > 1 ? acc : C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(`ETag "gato-v${O.ver}"`, u(36), u(35));
        x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(O.ver > 1 ? 'new photo (with a bow)' : 'the original photo', u(36), u(47));
        x.fillStyle = C.inkHi; x.font = `600 ${u(8.6)}px ${MONO3}`; x.fillText('Cache-Control: public,', u(4), u(66)); x.fillText('  max-age=3600', u(4), u(77));
      }
      x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('requests received:', u(4), u(96));
      x.textAlign = 'right'; x.fillStyle = O.down ? BAD() : acc; x.font = `600 ${u(18)}px ${MONO3}`; x.fillText(String(O.reqs), u(153), u(96)); x.textAlign = 'left';
      if (O.note && !O.down) { x.fillStyle = C.inkHi; fit(x, u, O.note, 4, 118, 8.6, 150); }
      orTop.tex.needsUpdate = true; }
    { const cv = orFr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = O.down ? BAD() : O.lit > 0.5 ? acc : C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText('ORIGIN · SÃO PAULO', u(4), u(9));
      x.fillStyle = INK(); x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(O.down ? 'down' : 'where the photo is born', u(4), u(21));
      cv.tex.needsUpdate = true; }
    orMat.emissiveIntensity = O.down ? 0 : O.lit > 0.5 ? 0.06 : 0;
  }
  function drawScreen(o) {
    const key = JSON.stringify([fmtMs(o.ms), o.msTone, o.xc, o.xcTone, o.msg, o.log, o.orig.reqs, sc]) + thm(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('TIME UNTIL THE PHOTO', u(6), u(9));
    x.fillStyle = toneC(o.msTone); x.font = `600 ${u(o.ms < 0 ? 22 : 30)}px ${MONO3}`; x.fillText(fmtMs(o.ms), u(6), u(32));
    x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText(sc === 'lab' ? 'THE PROXY LOG SAYS' : 'X-CACHE', u(6), u(55));
    x.fillStyle = toneC(o.xcTone); fit(x, u, o.xc, 6, 68, 14, 160);
    x.fillStyle = INK(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(`requests at the origin: ${o.orig.reqs}`, u(6), u(85));
    const L0 = 186;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(L0 - 9), u(5)); x.lineTo(u(L0 - 9), u(89)); x.stroke();
    let y = 9;
    if (o.log) { x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('PROXY LOG', u(L0), u(y)); y += 12;
      x.fillStyle = acc; o.log.slice(0, 3).forEach(l => { fit(x, u, l, L0, y, 8.6, 348); y += 11; }); y += 3; }
    x.fillStyle = INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('LAST MESSAGE' + (o.msg ? ' · ' + o.msg.who.toUpperCase() : ''), u(L0), u(y)); y += 12.5;
    const lines = o.msg ? o.msg.h : ['(none yet)'], room = Math.floor((92 - y) / 11.8) + 1;
    lines.slice(0, room).forEach((l, i) => { x.fillStyle = i === 0 ? acc : l.startsWith('(') || l.startsWith(' ') ? INK() : C.inkHi; fit(x, u, l, L0, y + i * 11.8, i === 0 ? 10 : 9, 348); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Recife, São Paulo, 120 KB, 5 ms and 50 ms are the example from the module. The domain cdn.loja.example and the ETag "gato-v1" are made up. X-Cache is not a standard header: each CDN has its own name (X-Cache, CF-Cache-Status…) and its own values.</li>';
  const tl = (rows, on = -1) => `<table class="h3-sum"><tr><th>leg</th><th>carries</th><th>ms</th></tr>${rows.map((r, i) => `<tr${i === on ? ' class="on"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
  const DATA = {
    miss: () => tl([['Lena → edge', 'GET /gato.jpg', '2.5'], ['edge → origin', 'GET /gato.jpg', '25'], ['origin → edge', '200 · 120 KB', '25'], ['edge → Lena', '200 · X-Cache: MISS', '2.5'], ['total', '', '~55']], 4) +
      '<li>Origin response: <b>Cache-Control: public, max-age=3600</b> (may be stored for 1 hour) and <b>Content-Length: 122880</b> (120 KB).</li><li>The closest edge is chosen by the CDN (through DNS or anycast), not by the browser.</li><li>Recife → São Paulo: ~2,100 km in a straight line.</li><li>504 Gateway Timeout: the edge waited for the origin and gave up.</li>' + EX,
    hit: () => `<table class="h3-sum"><tr><th>access</th><th>X-Cache</th><th>Age</th><th>ms</th><th>origin</th></tr><tr><td>1st</td><td>MISS</td><td>0</td><td>~55</td><td>+1 request</td></tr><tr class="on"><td>2nd</td><td>HIT</td><td>12</td><td>~5</td><td>nothing</td></tr></table>` +
      '<li><b>Age</b>: how many seconds ago the copy left the origin. Fresh while Age &lt; max-age (12 &lt; 3600).</li><li>~55 ms ÷ ~5 ms = <b>11 times</b> faster.</li><li>Photo changed at the origin: the edge only finds out when max-age expires. To do it sooner: <b>purge</b> the URL at the edge or <b>change the name</b> (gato.v2.jpg).</li>' + EX,
    expire: () => `<table class="h3-sum"><tr><th>ETag at the origin</th><th>response</th><th>body</th></tr><tr class="on"><td>"gato-v1" (same)</td><td>304 Not Modified</td><td>0 bytes</td></tr><tr><td>"gato-v2" (different)</td><td>200 OK</td><td>120 KB</td></tr></table>` +
      '<li>The edge asks with <b>If-None-Match: "gato-v1"</b>. The other way is Last-Modified + If-Modified-Since, by date.</li><li>After the 304, the copy goes back to <b>Age 0</b> and is good for another <b>3600 s</b>.</li><li><b>stale-if-error=86400</b> (RFC 5861): the origin allows using the expired copy for up to 1 day if it fails.</li><li>REVALIDATED and STALE follow the names used by a popular CDN; others say RefreshHit or similar.</li>' + EX,
    lab: () => `<li><b>GET /gato.jpg</b> → key "GET/gato.jpg" → file cache/<b>${KEY1}</b></li><li><b>GET /gato.jpg?v=2</b> → key "GET/gato.jpgv=2" → file cache/<b>${KEY2}</b></li>` +
      '<li>Key: <b>sha1(method + path + query)</b>, in hex, becomes the file name.</li><li>Only the path goes to the origin: <b>?v=2 changes the key</b>, and the origin still receives /gato.jpg and sends the current photo.</li><li>It stores neither status nor headers: a 404 or a 500 from the origin would also become a file and be served forever.</li><li>In the repository the origin is https://uol.com.br; here, to follow the story, it is the store.</li><li class="h3-dim">Code: cdn/main.go, in the cache examples of the public repository of the blog author (github.com/msfidelis).</li>',
  };
  function countHtml() { const o = SP || spec(); return `<b${o.msTone === 'bad' ? ' class="bad"' : ''}>${fmtMs(o.ms)}</b><span>until the photo shows up</span><i>· ${sc === 'lab' ? 'log' : 'X-Cache'}: ${o.xc} · origin: ${o.orig.reqs} ${o.orig.reqs === 1 ? 'request' : 'requests'}</i>`; }
  function msgHtml() { const o = SP || spec(), s = cur();
    if (sc === 'lab') return `<b>Code · cdn/main.go</b>${s.code.replace(/</g, '&lt;')}`;
    return `<b>HTTP headers · ${o.msg ? o.msg.who : 'none yet'}</b>${(o.msg ? o.msg.h : ['(the request has not left yet)']).join('\n').replace(/</g, '&lt;')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="CDN scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="c3count" aria-live="off">${countHtml()}</div>
      <div class="i3-sql" id="c3msg">${msgHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cdn') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${fmtMs(o.ms)} · ${o.xc}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(290, 150, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 165, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1 2 3 4 · drag to rotate' };
})() });
