// Figura 3D (iso-glow): DNS. O celular da Lena precisa do IP de demo.fidelissauro.dev antes de abrir qualquer conexão.
// Celular à esquerda, resolver no meio, três torres ao fundo (Raiz, TLD .dev, autoritativo) e o servidor da página na frente.
// Pergunta e resposta viajam como luz; cada fala aparece num balão com o dado real. O relógio soma os ms de exemplo da aula.
// Cenários: sem cache, cache no resolver, cache no navegador (pulam etapas, como o widget da aula).
FIGS3D.push({ id: 'dns', name: 'DNS', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── dados de exemplo (os mesmos da aula) ──
  const NAME = 'demo.fidelissauro.dev', IP = '203.0.113.42', Q = 'demo.fidelissauro.dev. IN A?';
  const NS_TLD = 'ns-tld1.charlestonroadregistry.com.', NS_AUTH = 'ns1.exemplo.net.';
  const SC = ['none', 'res', 'nav'], SCNAME = { none: 'No cache', res: 'Resolver cache', nav: 'Browser cache' };
  const ORDER = ['cache', 'ask', 'root', 'tld', 'auth', 'back', 'conn', 'sum'];
  const LIST = { none: ORDER, res: ['cache', 'ask', 'conn', 'sum'], nav: ['cache', 'conn', 'sum'] };
  const MS = { none: { cache: 0, ask: 5, root: 25, tld: 25, auth: 30 }, res: { cache: 0, ask: 5 }, nav: {} };
  const TOTAL = sc => Object.values(MS[sc]).reduce((a, b) => a + b, 0);

  // ── geometria (unidades iso) ──
  plateWith(g0, 720, 250, [[18, 18], [702, 18], [18, 232], [702, 232]]);
  const mkGroup = id => { const g = new THREE.Group(); g.userData.go = id; g0.add(g); return g; };
  const glowCap = (x, y, z, w, d, h, r, parent) => { const m = capMat(); twCaps.push(m); rbox(x, y, z, w, d, h, r, m, parent); return m; };

  // celular da Lena (em pé, tela para a frente)
  const phG = mkGroup('cache');
  rbox(30, 150, 7, 100, 50, 8, 6, bodyMat, phG);
  rbox(40, 168, 15, 80, 14, 166, 11, bodyMat, phG);
  const phCap = glowCap(46, 166, 181, 68, 10, 3, 3, phG);
  const phScr = faceCanvas('front', 45, 182, 176, 70, 152, 5, phG);
  // resolver
  const rsG = mkGroup('ask');
  rbox(226, 112, 7, 112, 70, 92, 7, bodyMat, rsG);
  const rsCap = glowCap(236, 120, 99, 92, 54, 4, 5, rsG);
  const rsScr = faceCanvas('front', 232, 182, 93, 100, 62, 6, rsG);
  slitsUV(frontUV(226, 182, 99), 8, 104, 4, 72, 84, rsG);
  // torres: Raiz, TLD .dev, autoritativo
  const TW = [{ id: 'root', x: 400, h: 176 }, { id: 'tld', x: 506, h: 146 }, { id: 'auth', x: 612, h: 116 }];
  TW.forEach(T => { const g = mkGroup(T.id); T.g = g;
    rbox(T.x, 30, 7, 64, 56, T.h, 6, bodyMat, g);
    T.cap = glowCap(T.x + 6, 36, 7 + T.h, 52, 44, 5, 4, g);
    slitsUV(frontUV(T.x, 86, 7 + T.h), 10, 54, 4, 16, T.h - 30, g);
    T.top = [T.x + 32, 58, 12 + T.h]; });
  // servidor da página (o IP que o DNS devolve)
  const wbG = mkGroup('conn');
  rbox(560, 168, 7, 110, 56, 46, 6, bodyMat, wbG);
  const wbScr = faceCanvas('front', 568, 224, 46, 94, 30, 6, wbG);
  const wbLed = dotFront(656, 224, 38, 2.6, wbG); const wbGlow = glowPoints([W(656, 225, 38)], 0.22); g0.add(wbGlow);
  hazeAndShadow(g0, 360, 125, 8.6, 3.4);
  creases(first);

  // caminhos (curvas de luz): fraco sempre, aceso quando a luz passa
  const PORT = { ph: [80, 174, 188], rs: [282, 147, 104], web: [600, 196, 56] };
  TW.forEach(T => PORT[T.id] = T.top);
  const arc = (a, b, lift) => bezier(a, [a[0], a[1], a[2] + lift], [b[0], b[1], b[2] + lift], b, 48);
  const PATHS = {}; [['nr', 'ph', 'rs', 60], ['root', 'rs', 'root', 70], ['tld', 'rs', 'tld', 80], ['auth', 'rs', 'auth', 90], ['web', 'ph', 'web', 70]].forEach(([k, a, b, l]) => {
    const pts = arc(PORT[a], PORT[b], l); PATHS[k] = { pts, cum: cumLen(pts), dim: polyLine(pts, lineMat, g0), lit: polyLine(pts, accentLineMat, g0) }; });
  const mkDot = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.28); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOT = mkDot(13);

  // ── rótulos que olham para a câmera (sempre legíveis) ──
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
      const fs = t.h * P, f1 = `600 ${fs}px ${MONO3}`, f2 = `${fs * 0.8}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.8 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.6 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tPh = tag(14), tRs = tag(14), tWb = tag(12), tClock = tag(15);
  const tTw = TW.map(() => tag(14));
  const tQ = tag(12), tA = tag(12);

  // ── roteiro ──
  let sc = 'none', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-dns3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  const ids = () => LIST[sc], N = () => ids().length, cur = () => ids()[step];
  const ord = id => ORDER.indexOf(id);
  const pick = o => o[sc] ?? o.all;
  // falas de cada passo: caminho, sentido, texto do balão e onde ele fica
  const CARD_Q = { nr: [200, 175, 175], root: [300, 120, 200], tld: [300, 120, 200], auth: [300, 120, 200], web: [330, 210, 120] };
  const CARD_A = { root: [430, 58, 300], tld: [520, 58, 290], auth: [570, 58, 330] };
  const LEGS = {
    cache: () => [{ pulse: 'ph', card: sc === 'nav' ? [`✓ cache: ${IP}\nTTL: 180 s left · nothing goes to the network`, 'acc'] : ['browser cache: ✕\nsystem cache: ✕ (miss)', 'hi'] }],
    ask: () => sc === 'res'
      ? [{ path: 'nr', dir: 1, card: [Q, 'hi', 'phone → resolver'], at: CARD_Q.nr }, { pulse: 'rs', card: ['resolver: ✓ it is in the cache', 'acc'] },
         { path: 'nr', dir: -1, card: [`${NAME}. A ${IP}`, 'acc', 'from cache · TTL 214 s'], at: [200, 175, 175] }]
      : [{ path: 'nr', dir: 1, card: [Q, 'hi', 'phone → resolver'], at: CARD_Q.nr }, { pulse: 'rs', card: ['resolver: ✕ not in the cache\nI will ask for you', 'hi'] }],
    root: () => [{ path: 'root', dir: 1, card: [Q, 'hi', 'resolver → root'], at: CARD_Q.root }, { path: 'root', dir: -1, card: ['ask .dev', 'acc', `dev. NS ${NS_TLD}`], at: CARD_A.root }],
    tld: () => [{ path: 'tld', dir: 1, card: [Q, 'hi', 'resolver → .dev TLD'], at: CARD_Q.tld }, { path: 'tld', dir: -1, card: ['ask ns1', 'acc', `fidelissauro.dev. NS ${NS_AUTH}`], at: CARD_A.tld }],
    auth: () => [{ path: 'auth', dir: 1, card: [Q, 'hi', 'resolver → authoritative'], at: CARD_Q.auth }, { path: 'auth', dir: -1, card: [`${NAME}. A ${IP}`, 'acc', 'TTL 300 s · final answer'], at: CARD_A.auth }],
    back: () => [{ pulse: 'rs', card: ['resolver: saved in the cache\nfor 300 s (TTL)', 'acc'] }, { path: 'nr', dir: -1, card: [`${NAME}. A ${IP}`, 'acc', 'resolver → phone · TTL 300 s'], at: CARD_Q.nr }],
    conn: () => [{ path: 'web', dir: 1, card: [`TCP SYN → ${IP}:443`, 'acc', 'DNS is done; now the connection'], at: CARD_Q.web }],
    sum: () => [{ pulse: 'ph', card: [`no cache: ${TOTAL('none')} ms`, 'acc', `resolver cache: ${TOTAL('res')} ms\nbrowser cache: 0 ms`] }],
  };
  const LEG = 1.3, PAUSE = 0.45, PRE = 0.35;
  function timeline() { let t = PRE; const out = LEGS[cur()]().map(l => { const d = l.pulse ? 1.0 : LEG, o = { ...l, t0: t, t1: t + d }; t += d + PAUSE; return o; });
    return { legs: out, end: Math.max(t, 1.4) }; }
  let TL = timeline();
  const doneAt = id => ord(cur()) > ord(id) || (cur() === id && lt >= TL.end - PAUSE);     // a fala desse passo já terminou
  const before = () => ids().slice(0, step).reduce((a, k) => a + (MS[sc][k] || 0), 0);
  const clockMs = () => Math.round(before() + (MS[sc][cur()] || 0) * Math.min(1, lt / Math.max(0.01, TL.end - PAUSE)));

  const STEPS = {
    cache: { title: { all: 'First, the cache', nav: 'The browser cache already knows' },
      story: { all: `Lena taps the link ${NAME}. Before opening any connection, the browser needs the IP for that name. It looks in its own cache and then asks the phone's system, which has another one. Neither knows: cache miss.`,
        nav: `Lena opened this page 2 minutes ago. The browser still has the IP ${IP}, and the 300 s TTL has not expired (180 s left). Cache hit: no question leaves the phone.` },
      look: { all: 'The phone lights up inside and the bubble shows what the caches answered.' },
      key: { all: 'Before going to the network, everyone checks the cache.', nav: 'With the IP in cache, DNS costs 0 ms.' } },
    ask: { title: { all: 'The question goes to the resolver' },
      story: { all: 'The phone sends the question to the resolver: the DNS server the provider pointed to, or a public one like 1.1.1.1. It is a single question: "what is the IP for this name?". The resolver checks its own cache and does not have it either. From here on it does the work for the phone.',
        res: 'The phone sends the question to the resolver. It checks the cache and finds it: someone asked for this name 86 s ago. It answers right away, with the TTL that is left (214 s). Nobody talks to the root, the TLD or the authoritative server.' },
      look: { all: 'The light leaves the phone and reaches the resolver, carrying the question in the bubble.', res: 'The light goes to the resolver and comes right back; the three towers do not even light up.' },
      key: { all: 'The phone asks once; the resolver goes after the answer (recursive query).', res: 'A cache halfway saves the whole trip.' } },
    root: { title: { all: 'The resolver asks the root' },
      story: { all: 'The resolver starts at the top of the name tree: a root server. It sends the same question. The root does not know the IP, but it knows who handles .dev, and answers with a referral: the name servers of the .dev TLD.' },
      look: { all: 'The light goes from the resolver to the Root tower and comes back with the bubble "ask .dev".' },
      key: { all: 'The root does not know the IP: it only points to the TLD.' } },
    tld: { title: { all: 'The resolver asks the .dev TLD' },
      story: { all: 'The resolver repeats the question to the .dev server. It does not know the IP either, but it knows who the authoritative server for fidelissauro.dev is, and answers with its NS record.' },
      look: { all: 'The light goes to the .dev tower and comes back with the name of the authoritative server.' },
      key: { all: 'The TLD points to the domain\'s authoritative server.' } },
    auth: { title: { all: 'The authoritative server answers with the IP' },
      story: { all: `Finally, the resolver asks the authoritative server for fidelissauro.dev, which has the final word. It answers with the A record: ${NAME} = ${IP} (example IP), with a TTL of 300 s.` },
      look: { all: 'The light goes to the last tower and comes back with the A record in the bubble.' },
      key: { all: 'Only the authoritative server gives the IP; root and TLD just point the way.' } },
    back: { title: { all: 'The resolver saves it and sends it back' },
      story: { all: 'The resolver saves the answer in the cache for 300 s (the TTL) and sends the IP back to the phone. The system and the browser save it too. Anyone who asks again in the next 5 minutes gets the answer from the cache.' },
      look: { all: 'The resolver screen gets the A record line; the light returns to the phone.' },
      key: { all: 'The TTL says how long each cache can reuse the answer.' } },
    conn: { title: { all: 'The browser connects to the IP' },
      story: { all: `Only now does the browser open the connection: TCP (and then TLS) with ${IP}, port 443. DNS is done and cost about ${TOTAL('none')} ms in this example, before the first byte of the page.`,
        res: `Only now does the browser open the connection with ${IP}, port 443. With the resolver cache, DNS cost about ${TOTAL('res')} ms in this example.`,
        nav: `The browser opens the connection with ${IP}, port 443, without waiting for anything: DNS cost 0 ms.` },
      look: { all: 'The light now goes from the phone to the page server, in front.' },
      key: { all: 'DNS comes before everything: TCP only starts after it.' } },
    sum: { title: { all: 'Summary: DNS time' },
      story: { all: `Same name, three situations. No cache: ~${TOTAL('none')} ms and four servers. Resolver cache: ~${TOTAL('res')} ms. Browser cache: 0 ms. That is why almost every lookup costs little: caches at several levels answer first. Switch the scenario in the panel to compare.` },
      look: { all: 'The phone screen compares the three times; the lit bar is the selected scenario.' },
      key: { all: 'Chain with no cache: cache, resolver, root, TLD, authoritative. The cache cuts the chain.' } },
  };
  const X_ROOT = '<li>There are <b>13 sets</b> of root servers, from a.root-servers.net to m.root-servers.net. Each set has many copies around the world with the same address (<b>anycast</b>): over a thousand instances in total. The resolver talks to the closest one.</li>';
  const X_TTL = '<li><b>TTL</b> (time to live): how many seconds the answer is valid in cache. High: fewer queries, but an IP change takes a while to reach everyone. Low: fast change, more queries.</li>';
  const X_REC = '<li><b>Recursive vs iterative</b>: the phone makes a recursive query (asks the resolver for the finished answer). The resolver resolves iteratively: it asks server by server, following the referrals (root → TLD → authoritative).</li>';
  const DATA = {
    cache: () => `<li>Question: <b>${Q}</b></li><li>Browser cache: ${sc === 'nav' ? `<b>${IP}</b>, TTL left 180 s` : 'empty'}</li><li>System cache: ${sc === 'nav' ? 'no need to even look' : 'empty'}</li>`,
    ask: () => `<li>Phone → resolver 1.1.1.1 (example), UDP port 53</li><li>Recursive request (RD bit = 1): "bring me the finished answer"</li><li>Resolver cache: ${sc === 'res' ? `<b>${NAME}. A ${IP}</b>, TTL left 214 s` : 'none'}</li>${X_REC}`,
    root: () => `<li>Question: ${Q}</li><li>Answer: no IP. Referral: <b>dev. NS ${NS_TLD}</b> (and other .dev servers)</li>${X_ROOT}`,
    tld: () => `<li>Question: ${Q}</li><li>Answer: no IP. Referral: <b>fidelissauro.dev. NS ${NS_AUTH}</b> (example name)</li>`,
    auth: () => `<li>Question: ${Q}</li><li>Authoritative answer: <b>${NAME}. 300 IN A ${IP}</b></li><li>${IP} is in the 203.0.113.0/24 range, reserved for examples.</li>`,
    back: () => `<li>Resolver → phone: <b>${NAME}. A ${IP}</b>, TTL 300 s</li><li>Cached in: resolver, system and browser</li>${X_TTL}`,
    conn: () => `<li>TCP SYN → <b>${IP}:443</b>; then TLS</li><li>DNS in this scenario: <b>~${TOTAL(sc)} ms</b> (example)</li>`,
    sum: () => `${X_REC}${X_ROOT}${X_TTL}`,
  };
  const SUMT = `<table class="h3-sum"><tr><th>Scenario</th><th>Servers</th><th>DNS</th></tr>
    <tr><td>No cache</td><td>resolver, root, TLD, authoritative</td><td>~${TOTAL('none')} ms</td></tr>
    <tr><td>Resolver cache</td><td>only the resolver</td><td>~${TOTAL('res')} ms</td></tr>
    <tr><td>Browser cache</td><td>none</td><td>0 ms</td></tr></table>`;

  function nowHtml() { return `<li>DNS time: <b>${clockMs()} ms</b> <span class="h3-dim">(example)</span></li>${DATA[cur()]()}`; }
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cache scenario">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${pick(s.title)}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${pick(s.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${pick(s.key)}</p>
      ${cur() === 'sum' ? SUMT : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Step data</summary><ul class="h3-now" id="dnsnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'dns') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · dns ${clockMs()} ms`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'dns' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; TL = timeline(); phKey = rsKey = wbKey = ''; render(); SFX.bit(1); return true; }
  const goId = id => { const i = ids().indexOf(id); return go(i >= 0 ? i : step); };
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { const id = cur(); sc = v; try { localStorage.setItem('sdlabs-dns3d-sc', v); } catch (e) {}
    let i = ids().indexOf(id); if (i < 0) i = ids().filter(k => ord(k) < ord(id)).length - 1; return go(Math.max(0, i)); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % 3]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'dns') setSc(b.dataset.sc); });

  // ── telas ──
  let phKey = '', rsKey = '', wbKey = '';
  function drawPhone(d) {
    const key = JSON.stringify(d) + theme; if (key === phKey) return; phKey = key;
    const { x, P: P0 } = phScr, P = P0 * 1.35, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, phScr.c.width, phScr.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.roundRect(u(3), u(5), u(46), u(9), u(4)); x.stroke();
    x.fillStyle = C.inkHi; x.font = `600 ${u(3.4)}px ${MONO3}`; x.fillText(NAME, u(26), u(9.6));
    if (d.sum) {
      x.fillStyle = C.inkHi; x.font = `600 ${u(4.6)}px ${MONO3}`; x.fillText('DNS time', u(26), u(24));
      const mx = TOTAL('none');
      SC.forEach((v, i) => { const y = 34 + i * 24, on = v === sc, w = Math.max(1.5, 40 * TOTAL(v) / mx);
        x.textAlign = 'left'; x.fillStyle = on ? acc : C.ink; x.font = `${on ? 600 : 400} ${u(3.6)}px ${MONO3}`; x.fillText(SCNAME[v], u(5), u(y));
        x.strokeStyle = on ? A_ : C.line; x.fillStyle = A_; x.lineWidth = u(0.5); x.beginPath(); x.roundRect(u(5), u(y + 4), u(w), u(6), u(1.5)); if (on) x.fill(); else x.stroke();
        x.fillStyle = on ? acc : C.ink; x.font = `600 ${u(4.2)}px ${MONO3}`; x.fillText(`${TOTAL(v)} ms`, u(Math.min(5 + w + 2, 34)), u(y + 15)); });
      phScr.tex.needsUpdate = true; return;
    }
    x.fillStyle = C.ink; x.font = `${u(3.8)}px ${MONO3}`; x.fillText(d.ip ? 'IP' : 'looking for the IP…', u(26), u(24));
    x.fillStyle = d.ip ? acc : C.ink; x.font = `600 ${u(d.ip ? 5 : 4.4)}px ${MONO3}`; x.fillText(d.ip ? IP : '?', u(26), u(32));
    x.fillStyle = C.ink; x.font = `${u(3.8)}px ${MONO3}`; x.fillText('DNS (example)', u(26), u(48));
    x.fillStyle = C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText(`${d.ms}`, u(26), u(60)); x.font = `${u(4)}px ${MONO3}`; x.fillText('ms', u(26), u(69));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(77)); x.lineTo(u(48), u(77)); x.stroke();
    x.fillStyle = C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText('browser cache', u(26), u(83));
    x.fillStyle = d.cache ? acc : C.ink; x.font = `600 ${u(4)}px ${MONO3}`; x.fillText(d.cache ? `${IP}` : 'empty', u(26), u(90));
    if (d.cache) { x.font = `${u(3.4)}px ${MONO3}`; x.fillText(`TTL ${d.cache} s`, u(26), u(96)); }
    x.fillStyle = d.conn ? acc : C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText(d.conn ? 'connecting…' : '', u(26), u(105));
    phScr.tex.needsUpdate = true;
  }
  function drawResolver(rows) {
    const key = JSON.stringify(rows) + theme; if (key === rsKey) return; rsKey = key;
    const { x, P } = rsScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, rsScr.c.width, rsScr.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('resolver cache', u(5), u(8));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(14)); x.lineTo(u(96), u(14)); x.stroke();
    if (!rows.length) { x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText('(nothing about this name)', u(5), u(24)); }
    rows.forEach(([a, b, on], i) => { const y = 22 + i * 13;
      x.fillStyle = on ? acc : C.inkHi; x.font = `600 ${u(4.6)}px ${MONO3}`; x.fillText(a, u(5), u(y));
      x.fillStyle = on ? acc : C.ink; x.font = `${u(4.2)}px ${MONO3}`; x.fillText(b, u(5), u(y + 6)); });
    rsScr.tex.needsUpdate = true;
  }
  function drawWeb(on) {
    const key = on + theme; if (key === wbKey) return; wbKey = key;
    const { x, P } = wbScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, wbScr.c.width, wbScr.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(IP, u(5), u(9));
    x.fillStyle = on ? acc : C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText(on ? 'SYN received · port 443' : 'page server', u(5), u(21));
    wbScr.tex.needsUpdate = true;
  }

  // ── um quadro da cena ──
  const place = (p, k) => { DOT.g.visible = true; DOT.g.position.copy(W(...p)); DOT.mat.emissiveIntensity = k; moveGlow(DOT.glow, [p[0], p[1], p[2] + 4], k > 0.5 ? 0.9 : 0); };
  const off = () => { DOT.g.visible = false; DOT.glow.material.uniforms.intensity.value = 0; };
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  function scene3() {
    const id = cur(), t = lt;
    let dot = false; const litPaths = new Set(), pulse = {};
    let qShown = null, aShown = null;
    TL.legs.forEach(l => {
      if (t < l.t0) return;
      const f = Math.min(1, (t - l.t0) / (l.t1 - l.t0));
      if (l.pulse) { if (f < 1) pulse[l.pulse] = 0.5 + 0.5 * Math.sin(f * Math.PI * 3); else pulse[l.pulse] = pulse[l.pulse] ?? 0.35; }
      if (l.path) { litPaths.add(l.path);
        if (f < 1) { const P = PATHS[l.path], g = l.dir > 0 ? ease(f) : 1 - ease(f); place(alongPts(P.pts, P.cum, g), 1.3); dot = true; } }
      if (l.card) { if (l.pulse || l.dir < 0 || l.path === 'web') aShown = l; else qShown = l; }
    });
    if (!dot) off();
    Object.entries(PATHS).forEach(([k, P]) => { P.lit.visible = litPaths.has(k); });
    // balões: pergunta perto de quem pergunta, resposta perto de quem responde
    const cardText = l => l.card[2] ? `${l.card[0]}\n${l.card[2]}` : l.card[0];
    if (qShown && aShown && aShown.path === qShown.path) qShown = null;      // a resposta volta pelo mesmo caminho: o balão dela substitui o da pergunta
    const phone = innerWidth < 640;
    if (phone && aShown) qShown = null;      // no celular, um balão por vez
    if (qShown) tQ.set(cardText(qShown), qShown.card[1]).at(...qShown.at); else tQ.hide();
    if (aShown) { let at = aShown.at || (aShown.pulse === 'ph' ? [80, 172, 290] : [282, 147, 190]);
      if (phone && aShown.path && aShown.path !== 'nr' && aShown.path !== 'web') at = [430, 70, 390];
      if (phone && aShown.pulse === 'rs') at = [190, 150, 210];
      tA.set(cardText(aShown), aShown.card[1]).at(...at); } else tA.hide();
    // nomes fixos
    tPh.set('LENA\'S PHONE', 'hi').at(80, 172, aShown && aShown.pulse === 'ph' ? 360 : 240);
    if (aShown && aShown.pulse === 'rs') tRs.hide();      // o balão do resolver já diz quem fala
    else tRs.set('RESOLVER\n1.1.1.1 (exemplo)', ['ask', 'back', 'root', 'tld', 'auth'].includes(id) ? 'hi' : 'dim').at(282, 160, 140);
    const used = sc === 'none';
    TW.forEach((T, i) => { const active = id === T.id, done = used && ord(id) > ord(T.id) && id !== 'sum' || (used && id === 'sum');
      const name = ['ROOT  ( . )', 'TLD  .dev', 'AUTHORITATIVE\nfidelissauro.dev'][i];
      tTw[i].set(used ? (done ? `✓ ${name}` : name) : `${name}\nnot needed`, active ? 'acc' : used ? 'hi' : 'dim').at(T.top[0], T.top[1], T.top[2] + 30);
      T.cap.emissiveIntensity = active && litPaths.has(T.id) ? 0.9 : done ? 0.18 : 0; });
    tWb.set(`PAGE SERVER\n${IP}`, id === 'conn' ? 'acc' : 'dim').at(615, 196, 110);
    tClock.set(`DNS time: ${clockMs()} ms`, 'acc').at(170, 240, -10);
    phCap.emissiveIntensity = pulse.ph ?? (id === 'conn' ? 0.5 : 0);
    rsCap.emissiveIntensity = pulse.rs ?? (litPaths.size && id !== 'conn' && id !== 'cache' ? 0.35 : 0);
    // telas
    const ipKnown = sc === 'nav' || doneAt(sc === 'res' ? 'ask' : 'back');
    drawPhone({ sum: id === 'sum', ms: clockMs(), ip: ipKnown, cache: sc === 'nav' ? 180 : ipKnown ? (sc === 'res' ? 214 : 300) : 0, conn: id === 'conn', sc });
    const rows = [];
    if (sc === 'res') rows.push([`${NAME}. A`, `${IP} · TTL 214 s`, id === 'ask']);
    if (sc === 'none') {
      if (doneAt('root')) rows.push(['dev. NS', 'ns-tld1.charlestonroadregistry…', id === 'root']);
      if (doneAt('tld')) rows.push(['fidelissauro.dev. NS', NS_AUTH, id === 'tld']);
      if (doneAt('auth')) rows.push([`demo… A ${IP}`, 'TTL 300 s', id === 'auth' || id === 'back']);
    }
    drawResolver(sc === 'nav' ? [['(not queried)', '', false]] : rows);
    const synIn = id === 'conn' && lt >= TL.legs[0].t1;
    drawWeb(synIn); wbLed.material = synIn ? ledOnMat : ledOffMat; wbGlow.material.uniforms.intensity.value = synIn ? 0.8 : 0;
  }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = { cache: [250, 140, 70], ask: [260, 140, 70], root: [280, 120, 80], tld: [290, 120, 80], auth: [300, 120, 80], back: [260, 140, 70], conn: [280, 150, 60], sum: [270, 130, 70] };
  const FOCUS_M = { cache: [240, 150, 90], ask: [250, 150, 90], root: [320, 110, 100], tld: [340, 110, 100], auth: [360, 110, 90], back: [250, 150, 90], conn: [330, 150, 70], sum: [280, 130, 90] };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > TL.end + 3) lt = 0;              // repete a fala do passo
    scene3();
    if (now - nowAt > 150) { nowAt = now; const el = document.getElementById('dnsnow'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[cur()];
      const want = W(f[0] + (mob ? -10 : -150), f[1], f[2] + (mob ? (innerWidth < 640 ? -300 : -250) : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(6.5, TL.end + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if (e.key === '1' || e.key === '2' || e.key === '3') return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) goId(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); phKey = rsKey = wbKey = ''; });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 130, -150), dist: innerWidth < 640 ? 10.6 : 15 } : { target: W(180, 130, 70), dist: 19 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1 2 3 · drag to rotate' };
})() });
