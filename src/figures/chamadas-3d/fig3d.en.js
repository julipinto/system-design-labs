// Figura 3D (iso-glow): a chamada que atravessa a loja. Atrás, em linha, app → gw-loja → bff-app → pedidos → pagamentos → PSP-A,
// com o PSP-B na frente do A; o disjuntor é o interruptor do elo pagamentos → PSP-A; os 50 encaixes na frente do pagamentos são o pool.
// Na faixa da frente, colunas: a rajada de chamadas a cada 100 ms (jitter), as chamadas por segundo (breaker), as barras de capacidade
// (retry, degradação) e a fila no tempo (backpressure). Atrás, suspenso, o mostrador (a conta do passo e o resultado).
// Cenários (botões e ?mode=timeout|retry|jitter|breaker|fallback|degradacao|backpressure; ?step=N abre no passo N).
// Dados: docs/escrita/resiliencia-brief.md e as aulas 1, 5–11 (pedido 1058 do Caio, PSP-A em 8 s das 20:20:00 às 20:21:30, pool de 50 a 30/s,
// timeout de 1 s, prazos 5/3/2,8/2,5/2,0/1,0 s, 27 chamadas por clique, a simulação dos 1.000 clientes (semente 7) e a do breaker (237 × 3.000),
// PSP-B p50 300 ms e 1% proativo, rajada de 1.300 req/s e níveis 1.000/1.333/1.667, fila de 5.000 que enche em 250 s e drena em 62,5 s).
FIGS3D.push({ id: 'chamadas', name: 'The call that crosses the store', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (n, d = 1) => { const [a, b] = n.toFixed(d).split('.'); return thou(+a) + (b ? '.' + b : ''); };
  // segundos depois das 20:20:00 → 20:20:01,3
  const clock = (s, d = 1) => { const v = Math.max(0, s), m = Math.floor(v / 60), r = v - m * 60;
    let ss = r.toFixed(d); if (+ss >= 60) ss = (59.9).toFixed(d); const [a, b] = ss.split('.');
    return `20:${20 + m}:${a.padStart(2, '0')}${b ? '.' + b : ''}`; };
  const minsec = s => { const v = Math.round(s), m = Math.floor(v / 60), r = v % 60; return m ? `${m} min${r ? ' ' + r + ' s' : ''}` : `${r} s`; };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── dados das simulações (Python, 20/10/2026) ──
  // 1.000 clientes, PSP fora até 2,0 s, depois 200/s; por janela de 100 ms: [chamadas, concluídos acumulados] (101 janelas, 0 a 10 s)
  const JIT = {"fixo":[[1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,980,960,940,920,900,880,860,840,820,800,780,760,740,720,700,680,660,640,620,600,580,560,540,520,500,480,460,440,420,400,380,360,340,320,300,280,260,240,220,200,180,160,140,120,100,80,60,40,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340,360,380,400,420,440,460,480,500,520,540,560,580,600,620,640,660,680,700,720,740,760,780,800,820,840,860,880,900,920,940,960,980,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000]],"exp":[[1000,1000,0,1000,0,0,0,1000,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,980,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40]],"full":[[1000,1000,761,556,297,364,286,177,171,165,175,165,141,111,96,83,67,80,75,83,62,84,74,69,74,52,55,47,38,38,34,37,35,36,36,40,35,37,46,45,30,32,28,41,38,25,28,29,25,23,18,27,26,21,16,10,11,13,10,13,5,15,13,8,17,10,16,7,17,6,4,9,5,10,14,7,3,5,10,9,4,4,6,4,5,7,3,5,6,1,2,0,1,3,1,2,4,0,0,0,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340,360,380,400,420,440,460,480,500,520,540,560,580,600,618,638,658,678,694,704,715,728,738,751,756,771,784,792,809,819,835,842,859,865,869,878,883,893,907,914,917,922,932,941,945,949,955,959,964,971,974,979,985,986,988,988,989,992,993,995,999,999,999,999,1000]],"equal":[[1000,1000,503,497,126,367,376,131,18,86,174,229,229,167,84,13,2,9,19,54,84,105,123,130,113,101,107,72,51,22,7,1,0,2,2,5,5,9,14,23,30,37,36,40,59,42,35,60,57,47,52,45,45,38,38,33,14,12,8,4,0,0,0,0,0,1,2,2,3,3,8,7,4,3,9,6,13,13,19,20,14,14,19,16,17,19,11,14,12,13,12,15,16,9,9,13,8,8,6,9,3],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,40,60,80,100,120,140,160,180,200,207,208,208,210,212,217,222,231,245,265,285,305,325,345,365,385,405,425,445,465,485,505,525,545,565,585,599,611,619,623,623,623,623,623,623,624,626,628,631,634,642,649,653,656,665,671,684,697,716,736,750,764,783,799,816,835,846,860,872,885,897,912,928,937,946,959,967,975,981,990,993]],"decorr":[[1000,261,529,421,223,243,252,273,226,200,187,188,160,159,149,177,137,156,117,136,125,125,117,106,117,96,89,87,81,80,77,63,66,65,65,59,51,49,49,42,53,47,51,43,33,27,32,24,29,36,29,23,21,20,15,17,20,13,19,16,10,9,7,8,7,17,10,13,12,10,6,7,7,9,2,2,5,2,5,4,9,6,5,3,3,2,5,2,4,1,5,4,5,0,2,1,3,1,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340,360,380,400,420,440,460,480,500,520,540,560,580,600,620,640,660,680,695,712,732,745,764,780,790,799,806,814,821,838,848,861,873,883,889,896,903,912,914,916,921,923,928,932,941,947,952,955,958,960,965,967,971,972,977,981,986,986,988,989,992,993,995,997,999]]};
  // breaker (30/s por 100 s, PSP-A em 8 s até 90 s, pool 50, timeout 1 s): a cada 0,5 s, [chamadas ao PSP acumuladas, falhas rápidas acumuladas]
  const BRK = [[0, 0], [15, 0], [30, 0], [40, 5], [40, 20], [40, 35], [40, 50], [40, 65], [40, 80], [40, 95], [40, 110], [40, 125], [40, 140], [40, 155], [40, 170], [40, 185], [40, 200], [40, 215], [40, 230], [40, 245], [40, 260], [40, 275], [40, 290], [40, 305], [40, 320], [40, 335], [40, 350], [40, 365], [40, 380], [40, 395], [40, 410], [40, 425], [40, 440], [40, 455], [40, 470], [40, 485], [40, 500], [40, 515], [40, 530], [40, 545], [40, 560], [40, 575], [40, 590], [40, 605], [40, 620], [40, 635], [40, 650], [40, 665], [40, 680], [40, 695], [40, 710], [40, 725], [40, 740], [40, 755], [40, 770], [40, 785], [40, 800], [40, 815], [40, 830], [40, 845], [40, 860], [40, 875], [40, 890], [45, 900], [45, 915], [45, 930], [45, 945], [45, 960], [45, 975], [45, 990], [45, 1005], [45, 1020], [45, 1035], [45, 1050], [45, 1065], [45, 1080], [45, 1095], [45, 1110], [45, 1125], [45, 1140], [45, 1155], [45, 1170], [45, 1185], [45, 1200], [45, 1215], [45, 1230], [45, 1245], [45, 1260], [45, 1275], [45, 1290], [45, 1305], [45, 1320], [45, 1335], [45, 1350], [45, 1365], [45, 1380], [45, 1395], [45, 1410], [45, 1425], [45, 1440], [45, 1455], [45, 1470], [45, 1485], [45, 1500], [45, 1515], [45, 1530], [45, 1545], [45, 1560], [45, 1575], [45, 1590], [45, 1605], [45, 1620], [45, 1635], [45, 1650], [45, 1665], [45, 1680], [45, 1695], [45, 1710], [45, 1725], [45, 1740], [45, 1755], [45, 1770], [45, 1785], [45, 1800], [45, 1815], [46, 1829], [50, 1840], [50, 1855], [50, 1870], [50, 1885], [50, 1900], [50, 1915], [50, 1930], [50, 1945], [50, 1960], [50, 1975], [50, 1990], [50, 2005], [50, 2020], [50, 2035], [50, 2050], [50, 2065], [50, 2080], [50, 2095], [50, 2110], [50, 2125], [50, 2140], [50, 2155], [50, 2170], [50, 2185], [50, 2200], [50, 2215], [50, 2230], [50, 2245], [50, 2260], [50, 2275], [50, 2290], [50, 2305], [50, 2320], [50, 2335], [50, 2350], [50, 2365], [50, 2380], [50, 2395], [50, 2410], [50, 2425], [50, 2440], [50, 2455], [50, 2470], [50, 2485], [50, 2500], [50, 2515], [50, 2530], [50, 2545], [50, 2560], [50, 2575], [50, 2590], [50, 2605], [50, 2620], [50, 2635], [50, 2650], [50, 2665], [50, 2680], [50, 2695], [50, 2710], [50, 2725], [50, 2740], [50, 2755], [57, 2763], [72, 2763], [87, 2763], [102, 2763], [117, 2763], [132, 2763], [147, 2763], [162, 2763], [177, 2763], [192, 2763], [207, 2763], [222, 2763], [237, 2763]];
  const BRK_EV = [[1.3, 'open'], [31.3, 'half'], [32.43, 'open'], [62.47, 'half'], [63.6, 'open'], [93.6, 'half'], [93.91, 'closed']];
  const brkState = s => { let st = 'closed'; for (const [at, v] of BRK_EV) if (s >= at) st = v; return st; };
  const brkAt = s => { const i = clamp(Math.floor(s * 2), 0, BRK.length - 1); return BRK[i]; };

  // ── cenários ──
  const SC = ['timeout', 'retry', 'jitter', 'breaker', 'fallback', 'degradacao', 'backpressure'];
  const SCNAME = { timeout: 'Timeout', retry: 'Retry', jitter: 'Jitter', breaker: 'Breaker', fallback: 'Fallback', degradacao: 'Degradation', backpressure: 'Backpressure' };
  const SCFULL = { timeout: 'Timeout, deadlines and key', retry: 'Retry storm', jitter: 'Backoff and jitter', breaker: 'Circuit breaker',
    fallback: 'Fallback', degradacao: 'Degradation', backpressure: 'Backpressure' };
  const AULA = { timeout: 'aula-6-timeouts', retry: 'aula-7-estrategias-de-retry', jitter: 'aula-7-estrategias-de-retry', breaker: 'aula-8-circuit-breakers',
    fallback: 'aula-9-fallbacks', degradacao: 'aula-10-graceful-degradation', backpressure: 'aula-11-backpressure-emergencial' };
  let clk = 0, sc = 'timeout', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-chamadas3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  const B = {};
  const BIG = { s1: 17, fs: 14, lh: 18, y0: 40 }, SMALL = { s1: 16, fs: 14, lh: 18, y0: 41 };
  function block(nm, x, y, w, d, h, cfg = SMALL, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y] };
  }
  // a linha da chamada
  const CY = 90, BX = { app: [24, 108], gw: [152, 108], bff: [280, 108], ped: [408, 120], pag: [548, 150], pspa: [766, 114] };
  block('app', 24, 40, 108, 100, 22); block('gw', 152, 40, 108, 100, 22); block('bff', 280, 40, 108, 100, 22);
  block('ped', 408, 40, 120, 100, 22); block('pag', 548, 40, 150, 100, 26); block('pspa', 766, 40, 114, 100, 26);
  block('pspb', 766, 196, 114, 96, 20);
  block('idem', 300, 176, 228, 118, 12);                     // a tabela idempotencia, na frente do pedidos
  block('cdn', 24, 176, 116, 96, 16); block('cat', 160, 176, 300, 118, 22, BIG);   // degradação
  block('prod', 24, 40, 236, 100, 22, BIG); block('fila', 280, 40, 418, 100, 16, BIG); block('proj', 766, 40, 114, 100, 22);   // backpressure
  const NAMES = Object.keys(B);
  // o disjuntor: base e alavanca no elo pagamentos → PSP-A
  const SWG = new THREE.Group(); g0.add(SWG); SWG.visible = false;
  rbox(704, 72, PL, 56, 36, 6, 3, bodyMat, SWG); rbox(706, 84, PL + 6, 8, 12, 10, 2, bodyMat, SWG); rbox(750, 84, PL + 6, 8, 12, 8, 2, bodyMat, SWG);
  creases(first);
  const BOX = new THREE.BoxGeometry(1, 1, 1), BOX0 = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5), XV = new THREE.Vector3(1, 0, 0);
  const swMat = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const pivot = new THREE.Group(); pivot.position.copy(W(710, CY, PL + 14)); SWG.add(pivot);
  const lever = new THREE.Mesh(BOX0, swMat); lever.scale.set(46 * TS, 5 * TS, 8 * TS); lever.position.set(0, -2.5 * TS, -4 * TS); pivot.add(lever);
  const swGlow = glowPoints([W(0, 0, 0)], 0.4); g0.add(swGlow);
  let swAng = 0;

  // colunas (na faixa da frente) e encaixes do pool: caixas com base no chão
  const colMats = { acc: capMat(), bad: capMat(), dim: capMat() };   // fora de twCaps: a cor é posta a cada quadro, conforme o tema
  const badEm = new THREE.Color(0xe0180c);
  const COLS = Array.from({ length: 110 }, () => { const m = new THREE.Mesh(BOX0, colMats.dim); m.visible = false; g0.add(m); return m; });
  const SLOTS = Array.from({ length: 50 }, (_, i) => { const m = new THREE.Mesh(BOX0, colMats.dim); m.visible = false; g0.add(m);
    return { m, x: 550 + (i % 10) * 14.8, y: 168 + Math.floor(i / 10) * 25, h: 2 }; });

  // cabos grossos (vigas) e pontos de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BEAM = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 20 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
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
  const TAGS = Array.from({ length: 9 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const TF = x => [x, 432, 30];   // balão na faixa livre da frente da prancha

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const R = nm => BX[nm][0] + BX[nm][1], Lf = nm => BX[nm][0], Cx = nm => BX[nm][0] + BX[nm][1] / 2;
  const CAB = {
    ag: P3([[R('app'), CY], [Lf('gw'), CY]]), gb: P3([[R('gw'), CY], [Lf('bff'), CY]]), bp: P3([[R('bff'), CY], [Lf('ped'), CY]]),
    pp: P3([[R('ped'), CY], [Lf('pag'), CY]]), pa: P3([[R('pag'), CY], [Lf('pspa'), CY]]),
    pa1: P3([[R('pag'), CY], [710, CY]]), pa2: P3([[756, CY], [Lf('pspa'), CY]]),
    pb: P3([[R('pag'), 124], [732, 124], [732, 244], [766, 244]]),
    pi: P3([[468, 140], [468, 176]]),
    long: P3([[R('app'), CY], [Lf('pspa'), CY]]),
    cdn: P3([[78, 140], [78, 176]]), cat: P3([[334, 140], [334, 176]]),
    pf: P3([[260, CY], [280, CY]]), fp: P3([[698, CY], [766, CY]]),
  };
  const CHAIN = ['app', 'gw', 'bff', 'ped', 'pag', 'pspa'];
  const LINKS = { gw: CAB.ag, bff: CAB.gb, ped: CAB.bp, pag: CAB.pp, pspa: CAB.pa };
  // caminho de um ponto de luz de um bloco ao outro, por cima dos blocos e pelos cabos entre eles
  const way = (a, b) => { const i = CHAIN.indexOf(a), j = CHAIN.indexOf(b), pts = [[Cx(a), CY, 40]];
    for (let k = i; k < j; k++) pts.push([R(CHAIN[k]), CY, Z], [Lf(CHAIN[k + 1]), CY, Z], [Cx(CHAIN[k + 1]), CY, 40]); return pts; };
  const WAY = { full: way('app', 'pspa'), toPag: way('app', 'pag'), toPed: way('app', 'ped'), pa: way('pag', 'pspa'),
    pb: P3([[Cx('pag'), CY, 40], [R('pag'), 124], [732, 124], [732, 244], [766, 244], [823, 244, 34]]),
    pi: P3([[468, CY, 40], [468, 140], [468, 176], [414, 235, 26]]),
    gwBack: P3([[Cx('gw'), CY, 40], [Lf('gw'), CY], [R('app'), CY], [Cx('app'), CY, 40]]),
    long: P3([[Cx('app'), CY, 40], [R('app'), CY], [Lf('pspa'), CY], [Cx('pspa'), CY, 40]]),
    cat: P3([[Cx('app'), CY, 40], [R('app'), CY], [Lf('gw'), CY], [Cx('gw'), CY, 40], [R('gw'), CY], [Lf('bff'), CY], [334, CY, 40], [334, 140], [334, 176], [310, 235, 36]]),
    cdn: P3([[Cx('app'), CY, 40], [78, 140], [78, 176], [82, 224, 30]]),
    pf: P3([[142, CY, 40], [260, CY], [280, CY], [489, CY, 30], [698, CY], [766, CY], [823, CY, 40]]),
  };
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const SHOW = { timeout: ['app', 'gw', 'bff', 'ped', 'pag', 'pspa'], retry: ['app', 'gw', 'bff', 'ped', 'pag', 'pspa'], jitter: ['app', 'pspa'],
    breaker: ['app', 'gw', 'bff', 'ped', 'pag', 'pspa'], fallback: ['app', 'gw', 'bff', 'ped', 'pag', 'pspa', 'pspb'],
    degradacao: ['app', 'gw', 'bff', 'cat', 'cdn'], backpressure: ['prod', 'fila', 'proj'] };
  const POOL = { timeout: 1, breaker: 1, fallback: 1 };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cols: [], pool: null, sw: null, cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.app = act('app', '5 s', ['Caio · 1058', 'hi'], ['3 mugs', 'dim'], ['+ shipping 71.70', 'dim']);
    o.rows.gw = act('gw-loja', '3 s', ['entry', 'dim']);
    o.rows.bff = act('bff-app', '2.8 s', ['builds the page', 'dim']);
    o.rows.ped = act('pedidos', '2.5 s', ['order 1058', 'dim'], ['mug 35 → 32', 'dim']);
    o.rows.pag = act('pagamentos', '2.0 s', ['2 replicas × 20/s', 'dim'], ['pool of 50', 'dim']);
    o.rows.pspa = act('PSP-A', '1 s', ['p50 180 ms', 'dim'], ['charges the card', 'dim']);
    o.rows.pspb = act('PSP-B', 'BACKUP', ['p50 300 ms', 'dim']);
    o.rows.idem = act('idempotencia', 'TABLE', ['key · state · response', 'dim']);
    o.rows.cat = act('catalog', '10 REPLICAS', ['100 req/s each = 1,000', 'dim'], ['recommendations: on', 'hi'], ['full search', 'hi'], ['reviews: on', 'hi']);
    o.rows.cdn = act('CDN', 'MOD. 5', ['storefront', 'dim'], ['static', 'dim']);
    o.rows.prod = act('Kafka', 'PRODUCER', ['order events', 'dim'], ['120/s arriving', 'hi']);
    o.rows.fila = act('projector queue', 'LIMIT 5,000', ['empty', 'dim']); o.rows.fila.bar = [0, '0', 'acc'];
    o.rows.proj = act('meus-pedidos', 'PROJECTOR', ['100/s', 'hi']);
    if (sc === 'jitter') { o.rows.app = act('clients', '1,000', ['call together', 'hi'], ['at t = 0', 'dim']); o.rows.pspa = act('PSP', '200/s', ['down until 2.0 s', 'bad']); }
    if (sc === 'degradacao') o.rows.app = act('app', 'STOREFRONT', ['catalog', 'dim']);
    if (POOL[sc]) o.pool = { n: 0 };
    if (sc === 'breaker' || sc === 'fallback') o.sw = 'closed';
    if (sc === 'degradacao') o.beams.push({ pts: CAB.ag }, { pts: CAB.gb }, { pts: CAB.cat }, { pts: CAB.cdn });
    else if (sc === 'backpressure') o.beams.push({ pts: CAB.pf }, { pts: CAB.fp });
    else if (sc === 'jitter') o.beams.push({ pts: CAB.long });
    else { o.beams.push({ pts: CAB.ag }, { pts: CAB.gb }, { pts: CAB.bp }, { pts: CAB.pp });
      if (o.sw) o.beams.push({ pts: CAB.pa1 }, { pts: CAB.pa2 }); else o.beams.push({ pts: CAB.pa });
      if (sc === 'fallback') o.beams.push({ pts: CAB.pb }); }
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const showX = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  const bm = (o, pts, p) => { const b = o.beams.find(b => b.pts === pts); if (b) Object.assign(b, p); else o.beams.push({ pts, ...p }); };
  const pspSlow = (o, txt = 'answers in 8 s') => { o.on.pspa = 'bad'; o.rows.pspa = act('PSP-A', '1 s', [txt, 'bad'], ['20:20:00 → 21:30', 'dim']); };
  // colunas: x, largura, altura (unidades), tom; com y e profundidade da faixa da frente
  const col = (o, x, w, h, tone = 'acc', y = 322, d = 44) => o.cols.push({ x, w, h, tone, y, d });
  // barras com rótulo embaixo (retry e degradação): lista de [rótulo, valor, máximo, tom]
  function bars(o, list, x0 = 560, pitch = 80, w = 46) {
    list.forEach(([lab, v, max, tn], i) => { const x = x0 + i * pitch, h = Math.max(1.5, 92 * v / max); col(o, x, w, h, tn, 330, 40);
      T(o, [x + w / 2, 394, 8], lab, tn === 'dim' ? 'dim' : tn); });
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    timeout: [
      { id: 'normal', dur: 5, title: 'Normal day: 210 ms from click to PSP', yk: 'LITTLE\'S LAW', act: ['PSP-A at 8 s', '20:20:00'],
        code: ['in flight = rate × time', '30/s × 0.18 s = 5.4 connections', 'the pool has 50: plenty', 'path: 5 + 20 + 5 + 180 = 210 ms'],
        story: 'From Caio\'s app to PSP-A, the payment goes through <code>gw-loja</code>, <code>bff-app</code>, <code>pedidos</code> and <code>pagamentos</code>. On a normal day the round trip takes <b>210 ms</b>. <code>pagamentos</code> talks to PSP-A through a <b>pool of 50 connections</b>. At 30 orders/s, with the PSP answering in 180 ms, only <b>5.4</b> connections are busy at the same time (Little\'s Law: 30 × 0.18).',
        look: 'The 50 slots in front of pagamentos are the pool. About five light up; the rest stay empty.',
        key: 'In flight = rate × time: with a fast PSP, the pool has room to spare.',
        f(o, t) { lit(o, 'app', 'pag'); const f = (t * 0.3) % 1; pk(o, WAY.full, f, `${Math.round(210 * f)} ms`);
          o.pool.n = 5 + (Math.sin(clk * 3) > 0.3 ? 1 : 0);
          o.cnt = [['IN FLIGHT IN POOL', '5.4 of 50'], ['CLICK TO PSP', '210 ms', 'dim'], ['PSP-A p50', '180 ms', 'dim']];
          o.res = [['pool nearly empty', 'acc']]; T(o, [623, 300, 22], 'pool of 50', 'dim'); } },
      { id: 'lento', dur: 7, title: 'PSP-A at 8 s: the pool runs out in 1.67 s', yk: '8 s TIMEOUT', act: ['Timeout 2 s', 'the one from module 10'],
        code: ['30/s × 8 s = 240 in flight', 'the pool has 50', 'runs out in 50 ÷ 30 = 1.67 s', 'max throughput: 50 ÷ 8 = 6.25/s', 'the rest is refused'],
        story: 'At <b>20:20:00</b> PSP-A starts answering in <b>8 s</b> and stays that way for 90 s. If <code>pagamentos</code> waits the full 8 s, each connection is held for 8 s. Orders arrive at 30 per second: in <b>1.67 s</b> all 50 connections are busy and no answer has come back. From then on every payment is refused by the pool. The whole checkout stops because of one slow dependency.',
        look: 'The slots light up one by one until all 50 are red. PSP-A turns red and the calls stop halfway along the cable.',
        key: 'A slow dependency holds connections, and held connections exhaust the pool.',
        f(o, t) { const s = lin(t, 0.4, 5.4, 0, 3), n = Math.min(50, 30 * s), full = s >= 50 / 30; lit(o, 'app');
          pspSlow(o); o.on.pag = full ? 'bad' : 1; o.pool.n = n; o.pool.bad = full;
          for (let k = 0; k < 3; k++) pk(o, WAY.pa, clamp((s - k * 0.6) / 8 * 0.9 + 0.05, 0, 0.95), k === 0 ? `${thou((s) * 1000)} ms` : '', 'bad');
          bm(o, CAB.pa, { on: true, tone: 'bad' });
          o.cnt = [['IN FLIGHT', `${Math.floor(n)} of 50`, full ? 'bad' : ''], ['CLOCK', clock(s, 2)], ['REFUSED', thou(Math.max(0, 30 * (s - 50 / 30))), full ? 'bad' : 'dim']];
          o.res = full ? [['pool exhausted in 1.67 s', 'bad'], ['every payment refused', 'bad']] : [['filling…', 'dim']];
          if (full) T(o, [623, 300, 24], 'pool full', 'bad'); } },
      { id: 't2', dur: 7, title: '2 s timeout: it still saturates', yk: '2 s TIMEOUT', act: ['Timeout 1 s', 'p99.9 + margin'],
        code: ['30/s × 2 s = 60 in flight', '60 > 50: saturates', 'runs out in 1.67 s, as before', 'max throughput: 50 ÷ 2 = 25/s', 'in 100 s: 484 refused by the pool'],
        story: 'Module 10 used a <b>2 s</b> timeout. It looks prudent, but the math does not work: 30 orders/s × 2 s = <b>60</b> connections in flight, and the pool has 50. The pool runs out at the same 1.67 s and starts refusing the rest. Simulating the 100 s of the incident, <b>484</b> payments are refused by the pool.',
        look: 'The pool fills up again until the end; this time connections are released every 2 s, but more come in than go out.',
        key: 'A timeout above pool ÷ rate saturates the pool just the same.',
        f(o, t) { const s = lin(t, 0.4, 5.4, 0, 3), n = Math.min(50, 30 * s), full = s >= 50 / 30; lit(o, 'app');
          pspSlow(o); o.on.pag = full ? 'bad' : 1; o.pool.n = n; o.pool.bad = full; o.rows.pag.rows.push(['timeout 2 s', 'hi']);
          pk(o, WAY.pa, clamp((s % 2) / 2, 0.02, 0.98), `${thou((s % 2) * 1000)} ms`, 'bad'); bm(o, CAB.pa, { on: true, tone: 'bad' });
          o.cnt = [['IN FLIGHT', '60 > 50', full ? 'bad' : ''], ['RUNS OUT IN', '1.67 s', 'dim'], ['REFUSED IN 100 s', '484', 'bad']];
          o.res = full ? [['saturates just the same', 'bad']] : [['filling…', 'dim']];
          if (full) T(o, [623, 300, 24], 'pool full', 'bad'); } },
      { id: 't1', dur: 7, title: '1 s timeout: 30 in flight, it fits', yk: 'WHY 1 s',
        code: ['PSP-A: p50 180 · p99 400 · p99.9 700 ms', 'accept 0.1% false timeouts → p99.9', '700 ms + margin = 1 s', '30/s × 1 s = 30 in flight ≤ 50', 'critical timeout: 50 ÷ 30 = 1.67 s'],
        story: 'The right timeout comes from a <b>percentile</b>. Accepting 0.1% false timeouts, AWS says to look at PSP-A\'s p99.9 (700 ms) and add a margin: <b>1 s</b>. Little\'s Law checks it: 30 × 1 = <b>30</b> in flight, below 50. With a slow PSP each payment still fails, but it fails in 1 s, and <code>pagamentos</code> stays up to try something else (PSP-B in lesson 9).',
        look: 'The pool stops at 30 lit slots and 20 empty ones. Calls to PSP-A come back red after 1,000 ms.',
        key: 'Timeout taken from the percentile and checked against pool ÷ rate: 1 s, below 1.67 s.',
        f(o, t) { const s = lin(t, 0.4, 4.4, 0, 3), n = Math.min(30, 30 * s); lit(o, 'app', 'pag');
          pspSlow(o); o.pool.n = n; o.rows.pag.rows.push(['timeout 1 s', 'acc']);
          pk(o, WAY.pa, clamp(s % 1, 0.02, 0.98), `${thou((s % 1) * 1000)} ms`, 'bad'); bm(o, CAB.pa, { on: true, tone: 'bad' });
          o.cnt = [['IN FLIGHT', `${Math.floor(n)} of 50`], ['CRITICAL TIMEOUT', '1.67 s', 'dim'], ['REFUSED BY POOL', '0', 'dim']];
          o.res = [['it fits: 20 connections left', 'acc'], ['each slow call fails in 1 s', 'dim']];
          T(o, [623, 300, 22], '30 of 50', 'acc'); } },
      { id: 'prazos', dur: 6, title: 'Chained deadlines: the outer one waits longer', yk: 'THE SUM OF ATTEMPTS',
        code: ['app 5 > gw-loja 3 > bff-app 2.8', '> pedidos 2.5 > pagamentos 2.0 > PSP 1.0', '3 attempts × 1 s + 0.1 + 0.2 = 3.3 s', '3.3 s > gw-loja\'s 3 s', 'retries only if time is left'],
        story: 'Each link waits <b>longer</b> than the one inside it: app <b>5 s</b>, <code>gw-loja</code> <b>3 s</b>, <code>bff-app</code> <b>2.8 s</b>, <code>pedidos</code> <b>2.5 s</b>, <code>pagamentos</code> <b>2.0 s</b> and the PSP <b>1.0 s per attempt</b>. That way the inner one gives up first and answers in time for its caller. Three attempts of 1 s with waits of 0.1 and 0.2 s add up to <b>3.3 s</b>, more than the 3 s of <code>gw-loja</code>: the third attempt would never reach anyone.',
        look: 'In front, a staircase: each column is one box\'s deadline, and it steps down from left to right.',
        key: 'The outer deadline is longer than the inner one, and the sum of the attempts fits in the caller\'s deadline.',
        f(o, t) { const f = lin(t, 0.3, 2.5, 0, 1); lit(o, 'app', 'gw', 'bff', 'ped', 'pag', 'pspa');
          [['app', 5], ['gw', 3], ['bff', 2.8], ['ped', 2.5], ['pag', 2.0], ['pspa', 1.0]].forEach(([nm, v], i) => { const w = 44, x = Cx(nm) - w / 2;
            col(o, x, w, Math.max(1.5, 90 * v / 5 * clamp(f * 6 - i)), 'acc', 300, 44); if (f * 6 - i > 0.6) T(o, [x + w / 2, 368, 8], dec(v, v % 1 ? 1 : 0) + ' s', 'acc'); });
          o.cnt = [['APP', '5 s'], ['gw-loja', '3 s', 'dim'], ['PSP', '1 s per attempt', 'dim']];
          o.res = [['outer > inner', 'acc'], ['3.3 s does not fit in 3 s', 'bad']]; } },
      { id: 'orfao', dur: 9, title: 'If it goes wrong: gw-loja gives up and c-7731 already exists', yk: 'A TIMEOUT DOES NOT CANCEL', act: ['Repeat with no key', 'the app redoes the POST'],
        code: ['2.0 s: pagamentos stops waiting', '3.0 s: gw-loja returns an error to the app', '8.0 s: the PSP finishes the charge', 'c-7731 exists and nobody knew', 'timeout = "I stopped waiting"'],
        story: 'A timeout only says "I stopped waiting", not "it did not happen". In module 12 the PSP took <b>8 s</b>, <code>pagamentos</code> gave up at 2 s and <code>gw-loja</code> returned an error to the app at 3 s. On the other side the PSP kept working and created the charge <code>c-7731</code>. Caio sees "error" and the card was charged. It is orphaned work: done for nobody.',
        look: 'gw-loja and the app turn red with the error, but the light stays on PSP-A until c-7731 appears.',
        key: 'Giving up on waiting does not undo what the other side is already doing.',
        f(o, t) { const s = lin(t, 0.4, 7.4, 0, 8.4); lit(o, 'pspa'); pspSlow(o, 'processing…');
          const pagGave = s >= 2, gwGave = s >= 3, made = s >= 8;
          o.on.pag = pagGave ? 'bad' : 1; o.on.gw = gwGave ? 'bad' : 1; o.on.app = gwGave ? 'bad' : 1;
          if (pagGave) o.rows.pag = act('pagamentos', '2.0 s', ['gave up at 2 s', 'bad'], ['error to pedidos', 'dim']);
          if (gwGave) { o.rows.gw = act('gw-loja', '3 s', ['error to app', 'bad']); o.rows.app = act('app', '5 s', ['Caio sees an error', 'bad'], ['1058?', 'dim']); }
          if (made) o.rows.pspa = act('PSP-A', 'CHARGED', ['c-7731 created', 'bad'], ['71.70 on the card', 'bad']);
          pk(o, WAY.toPag, s / 0.25, '');
          if (!made) { bm(o, CAB.pa, { on: true, tone: pagGave ? 'bad' : '' }); pk(o, WAY.pa, clamp(0.15 + s / 8 * 0.8, 0, 0.95), `${thou(s * 1000)} ms`, pagGave ? 'bad' : ''); }
          if (gwGave) pk(o, WAY.gwBack, lin(s, 3, 4, 0, 1), 'error', 'bad');
          o.cnt = [['CLOCK', clock(4 + s, 1)], ['THE APP SEES', gwGave ? 'error' : '…', gwGave ? 'bad' : 'dim'], ['AT THE PSP', made ? 'c-7731 charged' : 'processing', made ? 'bad' : 'dim']];
          o.res = made ? [['error in the app, charge on the card', 'bad'], ['orphaned work', 'bad']] : gwGave ? [['gw-loja gave up', 'bad']] : [];
          if (made) T(o, [823, 160, 34], 'c-7731 already exists', 'bad'); } },
      { id: 'semchave', dur: 7, title: 'The app repeats the POST with no key: two orders', yk: 'NO IDEMPOTENCY', act: ['Repeat with the key', 'Idempotency-Key'],
        code: ['POST /pedidos   (1st time: response lost)', 'POST /pedidos   (the app tries again)', 'pedidos does not know it is the same purchase', 'creates another order, another charge', '2 orders, 2 charges of 71.70'],
        story: 'Caio\'s app got no response and does what every app does: it tries again. With nothing saying "it is the same purchase", <code>pedidos</code> treats the repeat as a new purchase. <b>Two orders</b> are born and two charges of 71.70, as in Davi\'s app in module 12. <b>A new UUID on every attempt</b> is the same thing: each attempt looks like another purchase.',
        look: 'Two lights go down the path; pedidos shows 1058 and a second order in red.',
        key: 'Repeating without idempotency duplicates the effect.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.6, 4.6, 0, 1); lit(o, 'app', 'gw', 'bff');
          o.on.ped = f2 >= 1 ? 'bad' : 1; o.rows.ped = act('pedidos', '2.5 s', ['1058 · 71.70', 'acc'], f2 >= 1 ? ['1059 · 71.70 again', 'bad'] : ['', 'dim']);
          pk(o, WAY.toPed, f1, 'POST 1'); pk(o, WAY.toPed, f2, 'POST 2', 'bad');
          o.cnt = [['ORDERS CREATED', f2 >= 1 ? '2' : f1 >= 1 ? '1' : '0', f2 >= 1 ? 'bad' : ''], ['CHARGES', f2 >= 1 ? '2' : f1 >= 1 ? '1' : '0', f2 >= 1 ? 'bad' : 'dim'], ['KEY', 'none', 'dim']];
          o.res = f2 >= 1 ? [['the same purchase, twice', 'bad']] : [];
          if (f2 >= 1) T(o, [468, 160, 34], 'duplicate (hypothetical)', 'bad'); } },
      { id: 'comchave', dur: 8, title: 'With Idempotency-Key: the same 1058 comes back', yk: 'TABLE idempotencia (PostgreSQL 14)',
        code: ['INSERT … ON CONFLICT (chave) DO NOTHING', '  RETURNING chave', '1st arrival: INSERT 0 1 → creates 1058', 'repeat: INSERT 0 0', '→ returns 201 · pedido_id 1058'],
        story: 'Now the app generates the key <b>once</b> per purchase and sends it on every attempt: <code>Idempotency-Key: "3f9a2c7e-5b1d-4e8a-9c3f-7a2b4d6e8f10"</code>, 57 extra bytes in the header. <code>pedidos</code> tries to write the key into the <code>idempotencia</code> table. On the first arrival the <code>INSERT … ON CONFLICT DO NOTHING</code> returns 1 row and the order is created. On the repeat it returns 0 rows, and the service replies with what it stored: <code>201</code>, order <b>1058</b>.',
        look: 'The table lights up in front of pedidos. The second light hits it and comes back with the same 1058; pedidos still has a single order.',
        key: 'The key is born once per intent; repeating returns the stored response.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.8, 4.8, 0, 1), fi = lin(t, 4.8, 5.8, 0, 1); showX(o, 'idem'); lit(o, 'app', 'gw', 'bff', 'ped');
          o.rows.ped = act('pedidos', '2.5 s', ['1058 · 71.70', 'acc'], ['just one order', 'dim']);
          o.on.idem = 1; o.rows.idem = act('idempotencia', 'TABLE', ['3f9a2c7e-… · concluido', 'acc'], ['{"status":201,', 'hi'], [' "pedido_id":1058}', 'hi'], [f2 >= 1 ? 'repeat: INSERT 0 0' : '1st: INSERT 0 1', f2 >= 1 ? 'acc' : 'dim']);
          bm(o, CAB.pi, { on: true }); pk(o, WAY.toPed, f1, 'POST · key'); pk(o, WAY.toPed, f2, 'POST · same key'); pk(o, WAY.pi, fi, '201 · 1058');
          o.cnt = [['ORDERS CREATED', f1 >= 1 ? '1' : '0'], ['HEADER', '+57 B', 'dim'], ['RESPONSE', f2 >= 1 ? '201 · 1058' : '…', 'dim']];
          o.res = f2 >= 1 ? [['the same 1058 back', 'acc'], ['different body: 422', 'dim']] : []; } },
      { id: 'chave-nova', dur: 7, title: 'If it goes wrong: a new key on every attempt', yk: 'THE KEY IS BORN IN THE WRONG PLACE',
        code: ['attempt 1: key 3f9a2c7e-…', 'attempt 2: new key (another UUID)', 'INSERT 0 1 and INSERT 0 1', 'two "first arrivals"', 'the key is born once per purchase'],
        story: 'The table only helps if the key is the same. If the app generates a UUID <b>on every attempt</b>, the repeat arrives with another key, the <code>INSERT</code> returns 1 row again and the order is created once more. The key has to be born when Caio taps "pay", not when the code sends the request. The other hole: the key is reserved and the process dies before storing the response; the repeat finds <code>processando</code> forever, and someone needs a deadline to decide.',
        look: 'The table gets two rows, each with one key, and pedidos has two orders in red again.',
        key: 'A new key on every attempt is the same as having no key.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.6, 4.6, 0, 1), dup = f2 >= 1; showX(o, 'idem'); lit(o, 'app', 'gw', 'bff');
          o.on.ped = dup ? 'bad' : 1; o.on.idem = dup ? 'bad' : 1;
          o.rows.ped = act('pedidos', '2.5 s', ['1058 · 71.70', 'acc'], dup ? ['1059 · 71.70 again', 'bad'] : ['', 'dim']);
          o.rows.idem = act('idempotencia', 'TABLE', ['3f9a2c7e-… · concluido', 'acc'], dup ? ['9b1e04d2-… · concluido', 'bad'] : ['', 'dim'], ['each key: INSERT 0 1', dup ? 'bad' : 'dim']);
          bm(o, CAB.pi, { on: true, tone: dup ? 'bad' : '' }); pk(o, WAY.toPed, f1, 'key 3f9a…'); pk(o, WAY.toPed, f2, 'key 9b1e…', 'bad');
          o.cnt = [['ORDERS CREATED', dup ? '2' : f1 >= 1 ? '1' : '0', dup ? 'bad' : ''], ['KEYS', dup ? '2' : '1', dup ? 'bad' : 'dim'], ['THE RIGHT ONE', '1 key per purchase', 'dim']];
          o.res = dup ? [['two orders again', 'bad'], ['the key is born at the click', 'acc']] : []; } },
    ],
    retry: [
      { id: 'um', dur: 5, title: 'One click, one call', yk: 'THE LESSON 7 POLICY', act: ['PSP-A at 8 s', 'the layers retry'],
        code: ['up to 3 attempts (1 + 2)', 'only on 503, 504, timeout, connection refused', 'only with Idempotency-Key', '100 ms backoff, full jitter, 2 s cap', 'budget: 10% of calls'],
        story: 'With PSP-A answering, Caio\'s click becomes <b>one</b> call at each link and one to <code>pagamentos</code>. Retrying fixes transient failures (a lost packet, a replica restarting). The problem is when each layer decides to retry on its own, without knowing about the others.',
        look: 'One light crosses the line from end to end. The cables show ×1.',
        key: 'Retry fixes the transient failure, and only that.',
        f(o, t) { lit(o, 'app', 'pag'); pk(o, WAY.full, (t * 0.3) % 1, '1058');
          ['bff', 'ped', 'pag'].forEach(nm => T(o, [Lf(nm) - 10, CY, 44], '×1', 'dim'));
          o.cnt = [['CALLS TO pagamentos', '1'], ['PER CLICK', '1', 'dim'], ['CAPACITY', '40/s', 'dim']];
          o.res = [['one call per click', 'acc']]; } },
      { id: 'cascata', dur: 8, title: 'Three layers, three attempts each: 27', yk: 'THE MULTIPLICATION',
        code: ['gw-loja tries bff-app 3 times', 'each one: bff-app tries pedidos 3 times', 'each one: pedidos tries pagamentos 3 times', '3 × 3 × 3 = 27 per click', '3 layers × 2 attempts = 8'],
        story: 'With PSP-A at 8 s, <code>pagamentos</code> fails, and every layer above retries. <code>gw-loja</code> tries <code>bff-app</code> 3 times; each of those tries <code>pedidos</code> 3 times; each of those tries <code>pagamentos</code> 3 times. That is <b>27</b> calls to <code>pagamentos</code> per click. This is the loose thread from module 10.',
        look: 'The cables get ×3, ×9 and ×27 from left to right, and the lights multiply all the way to pagamentos.',
        key: 'Attempts from different layers multiply.',
        f(o, t) { const k = lin(t, 0.4, 5, 0, 3); lit(o, 'app', 'gw', 'bff', 'ped'); o.on.pag = k >= 3 ? 'bad' : 1; pspSlow(o);
          const m = [3, 9, 27], nms = ['bff', 'ped', 'pag'];
          nms.forEach((nm, i) => { if (k > i) { T(o, [Lf(nm) - 10, CY, 44], '×' + m[i], i === 2 ? 'bad' : 'acc'); bm(o, LINKS[nm], { on: true, flow: true, tone: i === 2 ? 'bad' : '' }); } });
          const n = k >= 3 ? 27 : k >= 2 ? 9 : k >= 1 ? 3 : 1;
          o.cnt = [['CALLS TO pagamentos', String(k >= 3 ? 27 : 1), k >= 3 ? 'bad' : ''], ['AT THIS LINK', '×' + n, 'dim'], ['PSP-A', 'at 8 s', 'bad']];
          o.res = k >= 3 ? [['27 calls per click', 'bad']] : [['multiplying…', 'dim']]; } },
      { id: 'carga', dur: 6, title: '30 orders/s × 27 = 810/s against 40/s', yk: 'THE MATH',
        code: ['30 orders/s × 27 = 810/s', 'pagamentos: 2 replicas × 20/s = 40/s', '810 ÷ 40 = 20.2×', '3 layers × 2 attempts: 30 × 8 = 240/s', '1 layer × 3 attempts: 30 × 3 = 90/s'],
        story: 'At Black Friday\'s 30 orders/s, 27 calls per click give <b>810/s</b> on a <code>pagamentos</code> that handles <b>40/s</b> (2 replicas of 20/s): <b>20.2 times</b> the capacity. <code>pagamentos</code>, which had no defect at all, goes down along with the PSP. With 2 attempts per layer it would be 240/s; with a single layer retrying 3 times, 90/s.',
        look: 'In front, the bars: the 40/s capacity is a low step; the 810/s one rises in red far above all the others.',
        key: 'The retry storm takes down the one that was healthy.',
        f(o, t) { const f = lin(t, 0.3, 2.5, 0, 1); lit(o, 'app', 'gw', 'bff', 'ped'); o.on.pag = 'bad'; pspSlow(o);
          o.rows.pag = act('pagamentos', '40/s', ['receives 810/s', 'bad'], ['20.2 × the capacity', 'bad']);
          bars(o, [['40/s cap.', 40, 810, 'acc'], ['1×3 · 90', 90 * f, 810, 'dim'], ['3×2 · 240', 240 * f, 810, 'dim'], ['3×3 · 810', 810 * f, 810, 'bad']], 300, 140, 60);
          bm(o, CAB.pp, { on: true, flow: true, tone: 'bad' });
          o.cnt = [['ARRIVING AT pagamentos', '810/s', 'bad'], ['CAPACITY', '40/s', 'dim'], ['OVERLOAD', '20.2×', 'bad']];
          o.res = [['pagamentos goes down too', 'bad']]; } },
      { id: 'uma', dur: 8, title: 'Only one layer retries, and only if time is left', yk: 'THE pagamentos DEADLINE (2.0 s)',
        code: ['attempt 1: 0 → 1.0 s (timeout)', 'wait: 0.1 s (backoff)', 'attempt 2: gets 2.0 − 1.0 − 0.1 = 0.9 s', 'attempt 3: no time left', 'gw-loja, bff-app and pedidos: ×1'],
        story: 'The first defense is to retry in <b>one layer only</b>; the others pass the error along. The second is the <b>deadline</b>: retrying is only worth it if time is left. <code>pagamentos</code> has 2.0 s. The first attempt to PSP-A spends 1.0 s, the wait is 0.1 s, and the second gets only what is left: <b>0.9 s</b>. The third does not fit, so it does not happen.',
        look: 'The top cables go back to ×1. At the PSP-A link, two lights leave one after the other, and the second one has the smaller clock.',
        key: 'One layer retries, within the caller\'s deadline.',
        f(o, t) { const s = lin(t, 0.4, 6, 0, 2.2); lit(o, 'app', 'gw', 'bff', 'ped', 'pag'); pspSlow(o);
          ['bff', 'ped', 'pag'].forEach(nm => T(o, [Lf(nm) - 10, CY, 44], '×1', 'dim'));
          const a1 = s < 1, a2 = s >= 1.1 && s < 2.0; bm(o, CAB.pa, { on: a1 || a2, tone: 'bad' });
          if (a1) pk(o, WAY.pa, 0.1 + s * 0.8, `1st · ${thou(s * 1000)} of 1,000 ms`, 'bad');
          if (a2) pk(o, WAY.pa, 0.1 + (s - 1.1) / 0.9 * 0.8, `2nd · ${thou((s - 1.1) * 1000)} of 900 ms`, 'bad');
          o.cnt = [['CALLS TO PSP', s >= 1.1 ? '2' : '1'], ['DEADLINE SPENT', `${dec(Math.min(2, s), 1)} of 2.0 s`, 'dim'], ['3rd ATTEMPT', s >= 2 ? 'does not fit' : '…', 'dim']];
          o.res = s >= 2 ? [['2 attempts, within the deadline', 'acc'], ['error returned in time', 'dim']] : []; } },
      { id: 'orcamento', dur: 6, title: 'Retry budget: 10% extra, never 27 times', yk: 'THE BUDGET',
        code: ['retries ≤ 10% of calls', '30/s × 1.1 = 33/s ≤ 40/s', 'SRE: 60 retries/min per process', 'budget spent: fail right away', 'only retry what is idempotent'],
        story: 'The third defense is a <b>budget</b>: at most 10% extra calls. At 30 orders/s, <code>pagamentos</code> receives <b>33/s</b> in the worst case, below 40/s. When the budget runs out, the failure comes back right away instead of becoming one more attempt. Google\'s SRE book gives the example of 60 retries per minute per process. And only what has an idempotency key is retried (lesson 5).',
        look: 'The 810/s bar disappears; in its place, a 33/s bar below the 40/s capacity.',
        key: 'With a budget, retries never exceed a fraction of the load.',
        f(o, t) { const f = lin(t, 0.3, 2.5, 0, 1); lit(o, 'app', 'gw', 'bff', 'ped', 'pag'); pspSlow(o);
          o.rows.pag = act('pagamentos', '40/s', ['receives 33/s', 'acc'], ['10% budget', 'dim']);
          bars(o, [['40/s cap.', 40, 810, 'acc'], ['no brake · 810', 810 * (1 - f), 810, 'dim'], ['10% · 33', 33, 810, 'acc']], 300, 180, 60);
          o.cnt = [['ARRIVING AT pagamentos', '33/s'], ['CAPACITY', '40/s', 'dim'], ['RETRIES', '≤ 10%', 'dim']];
          o.res = [['33/s fits in 40/s', 'acc']]; } },
      { id: 'metaestavel', dur: 8, title: 'If it goes wrong: the storm keeps the fire going', yk: 'METASTABLE FAILURE',
        code: ['20:21:30: PSP-A is back to 180 ms', 'the delayed retries keep arriving', 'pagamentos above 40/s', 'each timeout creates more retries', 'the cause is gone, the failure stayed'],
        story: 'With no brake, the worst comes later. At <b>20:21:30</b> PSP-A goes back to answering in 180 ms, but <code>pagamentos</code> is still drowning: the delayed retries from the three layers keep arriving, each one that times out creates more, and the queue never empties. The cause is gone and the failure stayed. This state has a name, <b>metastable</b> failure (Bronson et al., HotOS 2021), and only whoever cuts the load gets out of it.',
        look: 'PSP-A goes back to normal. pagamentos stays red, with the top cables still full of light.',
        key: 'Retry with no brake keeps the system down after the cause has passed.',
        f(o, t) { const back = t > 1.5; lit(o, 'app', 'gw', 'bff', 'ped'); o.on.pag = 'bad';
          if (back) { o.on.pspa = 1; o.rows.pspa = act('PSP-A', '1 s', ['back: 180 ms', 'acc'], ['20:21:30', 'dim']); } else pspSlow(o);
          o.rows.pag = act('pagamentos', '40/s', ['still drowning', 'bad'], ['delayed retries', 'bad']);
          ['gw', 'bff', 'ped', 'pag'].forEach(nm => bm(o, LINKS[nm], { on: true, flow: true, tone: 'bad' }));
          o.cnt = [['PSP-A', back ? '180 ms again' : 'at 8 s', back ? '' : 'bad'], ['pagamentos', 'overloaded', 'bad'], ['WHAT HOLDS IT', 'the retries', 'bad']];
          o.res = back ? [['the cause is gone, the failure stayed', 'bad']] : [];
          if (back) T(o, [Cx('pag'), CY, 50], 'still down', 'bad'); } },
    ],
    jitter: [
      { id: 'cena', dur: 5, title: '1,000 clients call at the same time', yk: 'THE SIMULATION', act: ['Fixed interval', '100 ms'],
        code: ['1,000 clients call at t = 0', 'the PSP is down until 2.0 s', 'then serves 200/s and refuses the rest', 'each client tries for up to 10 s', 'base 100 ms · cap 5 s · seed 7'],
        story: 'To see what the <b>wait</b> between attempts changes, the simulation has 1,000 clients call the PSP at the same instant. The PSP is down until <b>2.0 s</b>; after that it serves <b>200/s</b> (20 every 100 ms) and refuses the rest. Each client tries until a 10 s deadline. Each column in front is a 100 ms window; the height is how many calls arrived in it.',
        look: 'In front, the first column rises to 1,000: everyone called together, with the PSP down.',
        key: 'What matters is when each client tries again.',
        f(o, t) { lit(o, 'app'); o.on.pspa = 'bad'; jcols(o, 'fixo', 0);
          o.cnt = [['CLIENTS', '1,000'], ['PSP DOWN UNTIL', '2.0 s', 'dim'], ['THEN SERVES', '200/s', 'dim']]; o.res = [['5 strategies, same load', 'acc']]; } },
      jstep('fixo', 'Fixed 100 ms interval', 'Full jitter', ['wait = 100 ms, always', '45,500 calls · 45.5 per client', 'peak after it is back: 1,000', 'refused with the PSP up: 24,500', 'all finish; the last one at 6.9 s'],
        'Each client waits <b>100 ms</b> and tries again, always. During the 2 s of failure that is 1,000 calls every 100 ms. When the PSP comes back, 1,000 still arrive per window for 20 slots. Everyone eventually gets through, the last at 6.9 s, but with <b>45,500</b> calls: 45.5 per client, and <b>24,500</b> refused with the PSP already up.',
        'A wall of 1,000 columns up to 2 s, then a ramp that slowly goes down until 7 s.', 'A fixed interval hammers the PSP right when it comes back.'),
      jstep('full', 'Exponential + full jitter', 'Equal jitter', ['wait = random(0, min(5 s, 100 ms × 2ⁿ))', '7,540 calls', 'peak after it is back: 84', 'refused with the PSP up: 687', '1,000 finish in 10 s'],
        'The wait doubles on each attempt (100, 200, 400 ms…) and is <b>drawn at random</b> between zero and that value. Clients spread out in time: after the 2 s the peak is <b>84</b> calls per window, and only <b>687</b> are refused with the PSP up. All 1,000 finish within the 10 s, with <b>7,540</b> calls in total.',
        'The columns drop fast and become a low, spread-out carpet after the 2 s.', 'The random draw spreads the attempts and the peak falls from 1,000 to 84.'),
      jstep('equal', 'Exponential + equal jitter', 'Decorrelated', ['e = min(5 s, 100 ms × 2ⁿ)', 'wait = e/2 + random(0, e/2)', '7,162 calls · peak 130', 'refused with the PSP up: 1,085', '993 finish'],
        '<i>Equal jitter</i> guarantees half of the wait and draws only the other half. It spreads less than <i>full</i>: peak of <b>130</b> after the 2 s, <b>1,085</b> refused with the PSP up, <b>993</b> of 1,000 finished in time, with 7,162 calls. The order between <i>equal</i> and <i>full</i> is from this scenario; what always holds is that both beat no jitter.',
        'Weak waves are still visible in the columns, lower than with the fixed interval and higher than with full.', 'Half a fixed wait leaves some synchrony.'),
      jstep('decorr', 'Decorrelated jitter', 'No jitter', ['wait = min(5 s, random(100 ms, 3 × previous))', '7,590 calls · peak 125', 'refused with the PSP up: 1,397', '999 finish', 'the wait depends on the previous one'],
        '<i>Decorrelated</i> draws the next wait between 100 ms and triple the previous one, capped at 5 s. It stays close to the other jitter variants: peak of <b>125</b>, <b>1,397</b> refused with the PSP up and <b>999</b> finished, with 7,590 calls.',
        'The columns drop right after the first one and stay low until the end.', 'Any jitter spreads; what differs between them is small.'),
      jstep('exp', 'If it goes wrong: exponential with no jitter', null, ['wait = 100, 200, 400, 800, 1,600 ms…', 'everyone waits the same: waves of 1,000', '6,980 calls · peak 1,000', 'refused with the PSP up: 1,940', 'only 40 finish in time (4%)'],
        'Exponential <i>backoff</i> with no random draw looks prudent: each client waits 100, 200, 400, 800, 1,600 ms. But <b>everyone</b> waits the same and comes back together. Each wave brings 1,000 calls for 20 slots, and the rest wait even longer. It makes fewer calls than the fixed interval (6,980), but only <b>40</b> clients, <b>4%</b>, finish within the 10 s. AWS calls this strategy "the clear loser".',
        'Isolated 1,000 columns, ever further apart, with an empty gap between them.', 'Backoff with no jitter turns into synchronized waves: the peak stays at 1,000.'),
    ],
    breaker: [
      { id: 'cena', dur: 5, title: 'The circuit breaker on the pagamentos → PSP-A link', yk: 'THE CONFIGURATION', act: ['PSP-A at 8 s', '20:20:00'],
        code: ['window of 20 calls, minimum 10', 'opens at ≥ 50% failures', 'slow (> 1 s) counts as a failure', 'open for 30 s', 'half-open: 5 probes'],
        story: 'Between <code>pagamentos</code> and PSP-A there is a <b>circuit breaker</b>. While closed, it lets calls through and counts the result of the last <b>20</b> calls; with at least 10 counted and <b>50%</b> failures, it opens. A call slower than 1 s counts as a failure. While open, nothing goes through for <b>30 s</b>; then, in half-open, <b>5 probes</b> decide whether it closes.',
        look: 'The switch between pagamentos and PSP-A is closed, lit, and the calls go through it.',
        key: 'The breaker counts failures and stops calling whoever is failing.',
        f(o, t) { lit(o, 'app', 'pag', 'pspa'); o.pool.n = 5; o.sw = 'closed'; pk(o, WAY.pa, (t * 0.5) % 1, '180 ms');
          bm(o, CAB.pa1, { on: true }); bm(o, CAB.pa2, { on: true });
          o.cnt = [['STATE', 'closed'], ['WINDOW', '20 · minimum 10', 'dim'], ['OPENS AT', '≥ 50% failures', 'dim']]; o.res = [['everything passes and is counted', 'acc']];
          T(o, [732, CY, 50], 'breaker', 'acc'); } },
      bstep('abre', 'Opens at 1.3 s', 0, 2.6, 'WHY 1.3 s', ['the first 10 leave between 0 and 0.3 s', 'none comes back before 1 s', 'they fail by timeout between 1.0 and 1.3 s', '10 of 10 failed: it opens', '20:20:01.3'],
        'At 20:20:00 PSP-A starts answering in 8 s. The first 10 calls leave between 0 and 0.3 s and hit the 1 s timeout between <b>1.0 and 1.3 s</b>. With the minimum of 10 reached and 100% failures, the breaker <b>opens at 1.3 s</b>. The pool, which had reached 30 connections, empties.',
        'The switch lifts and turns red. The columns in front, one per second, stop growing.', 'With a 1 s timeout, the breaker opens 1.3 s after the failure starts.'),
      bstep('aberto', 'Open: 30 s of fast failure', 1.3, 31.2, 'FAST FAILURE',
        ['nothing passes for 30 s', 'instant answer: fast failure', 'the pool stays empty', 'PSP-A receives nothing', 'this is where the fallback comes in (lesson 9)'],
        'While open, the breaker answers right away, without calling PSP-A: this is the <b>fast failure</b>. The pool stays empty, <code>pagamentos</code> waits for nothing and PSP-A, which was already struggling, gets no more load. The payment still fails, but it fails in microseconds, and <code>pagamentos</code> is free to try PSP-B (lesson 9).',
        'The switch stays lifted. In front, the columns become low little plates: those are the fast failures.', 'While open, the breaker fails right away and spares both sides.'),
      bstep('sondas', 'Half-open: the probes fail and it reopens', 31, 64.5, 'THE PROBES',
        ['31.3 s: half-open, 5 probes', 'the probes hit 1 s: reopens at 32.43 s', '62.47 s: half-open again', '63.6 s: reopens', 'each test costs only 5 calls'],
        'After 30 s the breaker goes <b>half-open</b> at 31.3 s and lets 5 probes through. PSP-A is still at 8 s, the probes hit the timeout and it <b>reopens</b> at 32.43 s. At 62.47 s it tries again and reopens at 63.6 s. Each test costs 5 calls, not 900.',
        'The switch drops halfway, blinking, and lifts again. Two small columns appear at 31 s and 62 s.', 'Half-open tests the dependency with few calls.'),
      bstep('fecha', 'PSP-A comes back and the breaker closes at 93.91 s', 88, 100, '237 × 3,000',
        ['90 s (20:21:30): PSP-A is back to 180 ms', '93.6 s: half-open, 5 probes', 'the probes pass: it closes at 93.91 s', 'in 100 s: 237 calls to PSP-A', 'no breaker: 3,000 (2,700 useless)'],
        'PSP-A comes back at <b>20:21:30</b> (90 s). The breaker only finds out at the next half-open, at <b>93.6 s</b>; the probes pass and it <b>closes at 93.91 s</b>. In 100 s, PSP-A received <b>237</b> calls (54 during the failure) against <b>3,000</b> with no breaker, 2,700 of them useless. The other <b>2,763</b> were fast failures.',
        'The switch drops and lights up. The columns start rising again up to 30 per second after 94 s.', '237 calls instead of 3,000: PSP-A recovers with no load on top of it.'),
      { id: 'so-erro', dur: 7, title: 'If it goes wrong: a breaker that only counts errors', yk: 'SLOW IS FAILURE TOO',
        code: ['the PSP answers 200, but in 8 s', 'without "slow = failure", nothing counts as an error', 'the breaker never opens', 'the pool runs out in 1.67 s', 'checkout stops with the breaker closed'],
        story: 'A breaker that only counts <b>errors</b> does not see the slow PSP-A: the answers arrive in 8 s with status 200, "success". It stays closed the whole time and the pool runs out in <b>1.67 s</b>, as if there were no breaker. That is why the store\'s configuration counts a call above 1 s as a failure. The other way to get it wrong is a long timeout: with 2 s, the breaker only opens at <b>2.3 s</b> and <b>11</b> calls are still refused by the pool.',
        look: 'The switch stays closed and lit while the 50 slots of the pool turn red.',
        key: 'Slowness has to count as a failure, otherwise the breaker never opens.',
        f(o, t) { const s = lin(t, 0.4, 5, 0, 3), n = Math.min(50, 30 * s), full = s >= 50 / 30; lit(o, 'app'); o.sw = 'closed';
          o.on.pspa = 'bad'; o.rows.pspa = act('PSP-A', '200 OK', ['answers in 8 s', 'bad'], ['"success"', 'dim']); o.pool.n = n; o.pool.bad = full; o.on.pag = full ? 'bad' : 1;
          bm(o, CAB.pa1, { on: true, tone: 'bad' }); bm(o, CAB.pa2, { on: true, tone: 'bad' }); pk(o, WAY.pa, 0.1 + (s % 1) * 0.8, `${thou(s * 1000)} ms`, 'bad');
          o.cnt = [['STATE', 'closed, always', 'bad'], ['POOL', `${Math.floor(n)} of 50`, full ? 'bad' : ''], ['THE PSP ANSWERS', '200 in 8 s', 'dim']];
          o.res = full ? [['pool exhausted with the breaker closed', 'bad'], ['slow > 1 s = failure', 'acc']] : [];
          if (full) T(o, [623, 300, 24], 'pool full', 'bad'); } },
    ],
    fallback: [
      { id: 'cena', dur: 5, title: 'pagamentos has two PSPs', yk: 'ONE BREAKER PER PSP', act: ['Open the breaker', 'PSP-A at 8 s'],
        code: ['PSP-A: p50 180 ms · receives 30/s', 'PSP-B: p50 300 ms · backup', 'each with its own breaker', 'the state of A\'s breaker', 'decides when to use B'],
        story: 'Since module 12 the store has a second PSP under contract. PSP-A answers in 180 ms and gets all the traffic; <b>PSP-B</b> answers in <b>300 ms</b> and stays on standby. Each one has its own breaker. The <b>fallback</b> is the alternative path to the same goal (charging the card), paying a price: here, 120 ms more.',
        look: 'PSP-B sits in front of PSP-A, with its own cable coming out of pagamentos. For now, only A\'s cable has light.',
        key: 'A fallback is another path to the same result, at some cost.',
        f(o, t) { lit(o, 'app', 'pag', 'pspa'); o.pool.n = 5; pk(o, WAY.pa, (t * 0.5) % 1, '180 ms'); bm(o, CAB.pa1, { on: true }); bm(o, CAB.pa2, { on: true });
          o.cnt = [['PSP-A', '30/s'], ['PSP-B', '0/s', 'dim'], ['BREAKERS', 'one per PSP', 'dim']]; o.res = [['B waits', 'dim']]; } },
      { id: 'desvia', dur: 7, title: 'Breaker open: 1058 goes to PSP-B', yk: 'THE REACTIVE FALLBACK',
        code: ['20:20:01.3: A\'s breaker opens', '20:20:04: 1058 arrives', 'pagamentos → PSP-B', '59.70 + 12.00 = 71.70', 'approved in ~300 ms'],
        story: 'At <b>20:20:01.3</b> PSP-A\'s breaker opened. At <b>20:20:04</b> Caio\'s order <b>1058</b> arrives: 3 blue mugs (59.70) and shipping to Rio (12.00), <b>71.70</b>. With A open, <code>pagamentos</code> sends the charge to <b>PSP-B</b>, which approves in about 300 ms. Caio pays and never learns about the incident.',
        look: 'PSP-A\'s switch is lifted and red. The light of 1058 goes down the front cable to PSP-B, which lights up.',
        key: 'With the breaker open, the fallback keeps the sale.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.3, 3.8, 0, 1), ok = f2 >= 1; lit(o, 'app', 'gw', 'bff', 'ped', 'pag'); pspSlow(o); o.sw = 'open';
          if (ok) { lit(o, 'pspb'); o.rows.pspb = act('PSP-B', 'p50 300 ms', ['1058 · 71.70', 'acc'], ['approved', 'acc']); }
          bm(o, CAB.pb, { on: f2 > 0 && !ok }); pk(o, WAY.toPag, f1, '1058 · 71.70'); pk(o, WAY.pb, f2, '1058');
          o.cnt = [['O 1058', ok ? 'approved at B' : '…', ok ? '' : 'dim'], ['CLOCK', clock(4 + 0.3 * f2, 1)], ['PSP-A', 'breaker open', 'bad']];
          o.res = ok ? [['Caio paid', 'acc'], ['~120 ms slower', 'dim']] : []; } },
      { id: 'frete', dur: 6, title: 'The table shipping rate: another fallback on the same order', yk: 'FALLBACK VALUE', act: ['proactive 1%', '0.3/s to PSP-B'],
        code: ['carrier quote: failed', 'the table rate applies', 'Recife 15.00 · SP 9.00 · Rio 12.00', 'partner B: R$ 0.10 × A: R$ 0.03', '10 min at 30/s: +R$ 1,260'],
        story: 'The same order has another fallback. If the carrier quote fails, <code>pedidos</code> uses the <b>table shipping rate</b>: Recife 15.00, SP 9.00, <b>Rio 12.00</b>. It is a fallback value, less precise than the live quote. Another option would be a second quote partner, more expensive: R$ 0.10 versus R$ 0.03 per query, <b>+R$ 1,260</b> in 10 minutes at 30/s.',
        look: 'pedidos shows the quote in red and the Rio table lit right below it.',
        key: 'A fallback value trades precision for the ability to keep selling.',
        f(o, t) { const ok = t > 1.4; lit(o, 'app', 'pspb'); o.on.ped = 1; o.sw = 'open'; pspSlow(o);
          o.rows.ped = act('pedidos', '2.5 s', ['quote: failed', 'bad'], [ok ? 'Rio table: 12.00' : '…', ok ? 'acc' : 'dim'], ['1058 = 71.70', 'hi']);
          o.rows.pspb = act('PSP-B', 'p50 300 ms', ['1058 · 71.70', 'acc'], ['approved', 'acc']);
          o.cnt = [['SHIPPING FOR 1058', ok ? '12.00 (table)' : '…'], ['RECIFE · SP', '15.00 · 9.00', 'dim'], ['QUOTE', 'failed', 'bad']];
          o.res = ok ? [['the order closes with the table rate', 'acc']] : []; if (ok) T(o, [Cx('ped'), CY, 50], 'table shipping rate', 'acc'); } },
      { id: 'proativo', dur: 7, title: 'Proactive 1%: PSP-B always in use', yk: 'THE PROACTIVE FALLBACK',
        code: ['30/s × 1% = 0.3/s to PSP-B', '0.3 × 60 = 18 charges per minute', 'PSP-B really charges, every day', 'a defect shows up on a Tuesday', 'not at 20:20 on Black Friday'],
        story: 'A fallback that only runs during the incident is code nobody has tested. The <b>proactive</b> fallback sends <b>1%</b> of the traffic to PSP-B all the time: 30 × 1% = <b>0.3/s</b>, <b>18 per minute</b>. If B has a defect, it shows up on any random Tuesday, with 1% of the traffic. AWS says it prefers "continuously exercised code paths".',
        look: 'With the breaker closed, almost all the light goes to PSP-A, and a thin dotted thread always goes to PSP-B.',
        key: 'The fallback that runs every day is the fallback that works on the bad day.',
        f(o, t) { lit(o, 'app', 'pag', 'pspa', 'pspb'); o.pool.n = 5; o.sw = 'closed';
          o.rows.pspa = act('PSP-A', '1 s', ['29.7/s', 'acc']); o.rows.pspb = act('PSP-B', '1%', ['0.3/s', 'acc'], ['18 per minute', 'hi']);
          bm(o, CAB.pa1, { on: true, flow: true }); bm(o, CAB.pa2, { on: true, flow: true }); bm(o, CAB.pb, { on: true }); pk(o, WAY.pb, (t * 0.25) % 1, '1%');
          o.cnt = [['TO PSP-B', '0.3/s'], ['PER MINUTE', '18', 'dim'], ['TO PSP-A', '29.7/s', 'dim']]; o.res = [['B is tested every day', 'acc']]; } },
      { id: 'credencial', dur: 7, title: 'If it goes wrong: PSP-B with an expired credential', yk: 'THE FALLBACK NOBODY TESTED',
        code: ['without the proactive 1%', 'PSP-B has received nothing for months', '20:20:01.3: A\'s breaker opens', '100% of the traffic goes to PSP-B', 'expired credential: everything refused'],
        story: 'Without the proactive traffic, PSP-B went months without receiving anything. At 20:20:01.3 A\'s breaker opens and <b>100%</b> of the traffic goes to B, which refuses everything: the <b>credential expired</b> and nobody noticed. Caio\'s 1058 fails on both PSPs. There is another way for the fallback to make the failure worse: B has less capacity and goes down under A\'s whole traffic. That is why the fallback also needs a breaker and a limit.',
        look: 'A\'s switch lifts, the light goes down to PSP-B and B turns red.',
        key: 'A fallback that never runs fails exactly when it is called.',
        f(o, t) { const f2 = lin(t, 0.8, 2.6, 0, 1), bad = f2 >= 1; lit(o, 'app', 'pag'); pspSlow(o); o.sw = 'open';
          if (bad) { o.on.pspb = 'bad'; o.on.app = 'bad'; o.rows.pspb = act('PSP-B', '100%', ['expired credential', 'bad'], ['refuses everything', 'bad']); o.rows.app = act('app', '5 s', ['Caio: failed', 'bad']); }
          bm(o, CAB.pb, { on: true, tone: bad ? 'bad' : '' }); pk(o, WAY.pb, f2, '1058');
          o.cnt = [['PSP-B', bad ? 'expired credential' : '…', bad ? 'bad' : 'dim'], ['TRAFFIC AT PSP-B', '100%', 'bad'], ['O 1058', bad ? 'refused' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['both paths failed', 'bad'], ['the 1% would have warned us earlier', 'acc']] : []; } },
    ],
    degradacao: [
      { id: 'cena', dur: 5, title: 'The catalog: 10 replicas, 1,000 req/s', yk: 'THE CAPACITY', act: ['Burst of 1,300', '20:20, the newsletter'],
        code: ['10 ms of CPU per page', '= 100 req/s per replica', '10 replicas = 1,000 req/s', 'measured peak (module 14): 640', 'projected: 950'],
        story: 'The catalog builds the storefront. Each page costs <b>10 ms</b> of CPU, so each replica serves <b>100 req/s</b> and the 10 replicas, <b>1,000</b>. Module 14 measured a peak of 640 req/s and projected 950. In front, the red bar is the demand; the others are the capacity at each degradation level.',
        look: 'The demand bar (640) sits below the level 0 bar (1,000). Levels 1, 2 and 3 wait switched off.',
        key: 'Capacity = replicas × pages per second of each one.',
        f(o, t) { lit(o, 'app', 'gw', 'bff', 'cat'); dbars(o, 640, 0); pk(o, WAY.cat, (t * 0.35) % 1, '');
          o.cnt = [['CAPACITY', '1,000 req/s'], ['DEMAND', '640 req/s', 'dim'], ['PER REPLICA', '100 req/s', 'dim']]; o.res = [['360 req/s of headroom', 'acc']]; } },
      { id: 'rajada', dur: 6, title: '20:20: a burst of 1,300 req/s', yk: 'THE BURST', act: ['Level 1', 'no recommendations'],
        code: ['newsletter: 1,300 req/s', 'lasts a few seconds', 'capacity: 1,000 → 300 short', 'HPA: 10 → 14 replicas = 1,400', 'but takes minutes'],
        story: 'At 20:20 the newsletter goes out and the demand gives a <b>burst of 1,300 req/s</b>, for a few seconds. That is 300 short. Autoscaling (HPA, from 10 to 14 replicas, 1,400 req/s) would solve it, but it takes minutes, and the burst is over before then. If nothing is done, the queues grow and the storefront gets slow for everyone, including those on their way to pay.',
        look: 'The red bar goes past the level 0 bar. The catalog turns red.',
        key: 'A burst of seconds does not wait for autoscaling.',
        f(o, t) { const d = lin(t, 0.3, 2.3, 640, 1300); lit(o, 'app', 'gw', 'bff'); o.on.cat = d > 1000 ? 'bad' : 1; dbars(o, d, 0); pk(o, WAY.cat, (t * 0.5) % 1, '', d > 1000 ? 'bad' : '');
          o.cnt = [['DEMAND', `${thou(d)} req/s`, d > 1000 ? 'bad' : ''], ['CAPACITY', '1,000', 'dim'], ['SHORT BY', `${thou(Math.max(0, d - 1000))} req/s`, d > 1000 ? 'bad' : 'dim']];
          o.res = d > 1000 ? [['the storefront gets slow for everyone', 'bad']] : []; } },
      dstep(1, 'Level 1: no recommendations, 1,333 req/s', 'Level 2', ['switches off recommendations', '10 ms → 7.5 ms per page', '133 req/s per replica', '× 10 = 1,333 ≥ 1,300', 'the minimum level that holds'],
        'Degrading means <b>switching off on purpose</b> what is not essential. At level 1 the storefront goes out <b>without recommendations</b>: the page costs 7.5 ms, each replica serves 133 req/s and the 10 give <b>1,333</b>. That already covers the 1,300. It is the minimum level that holds the burst.',
        'The level 1 bar lights up and goes a little past the red bar. In the catalog, the recommendations line switches off.', 'Switching off what is not essential frees capacity for what is.'),
      dstep(2, 'Level 2: simplified search and no reviews, 1,667', 'Level 3', ['+ simplified search', '+ no reviews', '6 ms per page', '167 req/s × 10 = 1,667', 'more headroom, less store'],
        'Level 2 switches off more: simplified search and no reviews. The page drops to 6 ms, 167 req/s per replica, <b>1,667</b> in total. There is headroom, but the store gets poorer. For 1,300 level 1 was already enough; level 2 is for bigger bursts.',
        'The level 2 bar rises well above the demand. In the catalog, search and reviews change state.', 'Each level buys capacity with functionality.'),
      dstep(3, 'Level 3: only the static page from the CDN', 'Degrade too late', ['only the static page from the CDN', 'the storefront is served from the CDN (module 5)', 'the catalog receives almost nothing', 'no search, no recommendations', 'the last step before going down'],
        'At level 3 the storefront is a <b>static page on the CDN</b> (module 5). The catalog leaves the path and the CDN holds any burst. The store looks like a brochure: no search, no recommendations, no reviews. SRE priority: checkout first, then catalog, then recommendations.',
        'The light now goes from the app to the CDN. The catalog switches off, and the level 3 bar rises to the top.', 'The last step delivers a static storefront instead of none.'),
      { id: 'tarde', dur: 7, title: 'If it goes wrong: degrading too late', yk: 'TOO LATE',
        code: ['the replicas are already saturated', 'the toggle is read from the service that went down', 'the change does not arrive', 'degrade before going down', 'trigger: saturation signal (module 14)'],
        story: 'Degrading only works <b>before</b> going down. If someone turns on level 1 with the replicas already saturated, the change request joins the same queue as everything else, and the configuration is read from the service that went down: the change does not arrive. The trigger has to come from a saturation signal (module 14), with <b>hysteresis</b> and an owner to go back to level 0 after the burst.',
        look: 'The catalog is red and the level 1 bar stays switched off: it was requested, but not applied.',
        key: 'With the service saturated, there is nothing left to switch off.',
        f(o, t) { lit(o, 'app', 'gw', 'bff'); o.on.cat = 'bad'; dbars(o, 1300, 0);
          o.rows.cat = act('catalog', 'SATURATED', ['1,300 req/s on 1,000', 'bad'], ['level requested: 1', 'hi'], ['level applied: 0', 'bad'], ['toggle does not arrive', 'bad']);
          pk(o, WAY.cat, (t * 0.5) % 1, '', 'bad');
          o.cnt = [['DEMAND', '1,300', 'bad'], ['LEVEL REQUESTED', '1', 'dim'], ['LEVEL APPLIED', 'none', 'bad']];
          o.res = [['saturated, nothing changes anymore', 'bad'], ['degrade before going down', 'acc']]; } },
    ],
    backpressure: [
      { id: 'cena', dur: 5, title: '120 events/s arriving, 100/s leaving', yk: 'THE DEFICIT', act: ['Queue of 5,000', 'limitada'],
        code: ['120 events/s arriving', 'the projector processes 100/s', '20/s are left in the queue', 'bounded queue: 5,000', '5,000 ÷ 20 = 250 s to fill'],
        story: 'The <code>meus-pedidos</code> projector from module 18 reads the order events and builds each customer\'s list. It processes <b>100 events/s</b>. On Black Friday <b>120/s</b> arrive: <b>20/s</b> are left waiting in the queue. <b>Backpressure</b> is the consumer telling the producer to slow down.',
        look: 'The queue in the middle starts empty. More dots come in on the left than go out on the right.',
        key: 'With more coming in than going out, the queue grows by 20 per second.',
        f(o, t) { lit(o, 'prod', 'proj'); o.on.fila = 1; pk(o, WAY.pf, (t * 0.35) % 1, '120/s'); pk(o, WAY.pf, (t * 0.35 + 0.5) % 1, '');
          o.cnt = [['DEFICIT', '20/s'], ['ARRIVE', '120/s', 'dim'], ['LEAVE', '100/s', 'dim']]; o.res = [['the queue will grow', 'acc']]; } },
      { id: 'limitada', dur: 8, title: 'Bounded queue of 5,000: full in 250 s', yk: 'THE BOUNDED QUEUE', act: ['Block', 'the producer waits'],
        code: ['5,000 ÷ 20/s = 250 s (4 min 10 s)', 'full: it must refuse', 'the producer finds out', 'max delay: 5,000 ÷ 100 = 50 s', 'drain: 5,000 ÷ 80 = 62.5 s'],
        story: 'With a limit of <b>5,000</b>, the queue fills in 5,000 ÷ 20 = <b>250 s</b> (4 min 10 s). Once full, it accepts no more, and the producer <b>finds out</b>: that is the signal. The delay never goes past 50 s (5,000 ÷ 100), and when arrivals drop to 20/s the queue drains at 80/s and empties in <b>62.5 s</b>. Next, three ways to answer the producer.',
        look: 'The queue bar fills up to the 5,000 mark. The columns in front rise over time and stop at the ceiling.',
        key: 'A bounded queue turns overload into a signal.',
        f(o, t) { const s = lin(t, 0.4, 6, 0, 300), q = Math.min(5000, 20 * s), full = q >= 5000; lit(o, 'prod', 'proj'); o.on.fila = full ? 'bad' : 1;
          fila(o, q, full ? 'full: refuses' : 'filling'); qcols(o, s, x => Math.min(5000, 20 * x)); pk(o, WAY.pf, (t * 0.35) % 1, '');
          o.cnt = [['IN QUEUE', thou(q), full ? 'bad' : ''], ['TIME', minsec(s)], ['FULL IN', '250 s', 'dim']];
          o.res = full ? [['full: the producer must know', 'bad']] : [['filling at 20/s', 'dim']]; } },
      pstep('bloquear', 'Block: the producer waits', '429', 'BLOCK', ['queue full: the send waits', 'consumer pause', 'request(n): only asks for what it can take', 'the TCP window does the same', 'the producer moves at 100/s'],
        'The simplest way is to <b>block</b>: with the queue full, the send waits until a slot opens. The producer moves at the consumer\'s pace, 100/s. Reactive <i>streams</i> do this with <code>request(n)</code> (the consumer only asks for what it can take) and TCP with the receive window.',
        'The queue sits at the ceiling and Kafka shows "waiting". The dots come in at the same pace they go out.', 'Blocking makes the producer move at the consumer\'s pace.', 'waiting: 100/s'),
      pstep('429', '429 with Retry-After', 'Drop', '429 TOO MANY REQUESTS', ['HTTP/1.1 429 Too Many Requests', 'Retry-After: <seconds>', 'RFC 6585 · RFC 9110', 'the producer knows it has to wait', 'and for how long'],
        'In an API, the signal is the status <b><code>429</code></b> (RFC 6585) with the <b><code>Retry-After</code></b> header (RFC 9110): "too many requests, come back in so many seconds". The producer knows it has to wait and for how long, instead of retrying right away and becoming the storm from lesson 7.',
        'The queue sits at the ceiling; whatever arrives beyond that goes back to the left with a 429.', 'The 429 says "slower" and says when to come back.', 'gets 429'),
      pstep('descartar', 'Drop by priority', 'Unbounded queue', 'LOAD SHEDDING', ['CRITICAL_PLUS · CRITICAL', 'SHEDDABLE_PLUS · SHEDDABLE', 'under overload, refuse early', 'SHEDDABLE first (marketing)', 'the paid order gets through'],
        'When waiting is not an option, you <b>drop by priority</b> (<i>load shedding</i>). Google SRE uses four levels: <code>CRITICAL_PLUS</code>, <code>CRITICAL</code>, <code>SHEDDABLE_PLUS</code>, <code>SHEDDABLE</code>. Under overload, the store refuses early what is <code>SHEDDABLE</code> (marketing events) and lets through what touches a paid order. Better to refuse a little early than to delay everything.',
        'At the queue\'s entrance, the red dots (marketing) are refused; the lit ones (orders) go in.', 'Refusing early what can wait protects what cannot.', 'marketing refused'),
      { id: 'ilimitada', dur: 9, title: 'If it goes wrong: the unbounded queue', yk: 'THE QUEUE THAT HIDES',
        code: ['no limit, nothing is refused', '10 min: 12,000 events', 'delay: 12,000 ÷ 100 = 120 s, growing', 'memory fills up; the process dies with the queue', 'afterwards: 12,000 ÷ 80 = 150 s to drain'],
        story: 'The article calls "queueing in memory" backpressure. It is not: with no limit, nothing is refused and nobody finds out. In 10 minutes there are <b>12,000</b> events in the queue and <b>120 s</b> of delay, growing. Lena sees her order 2 minutes later; memory fills up and the process may die with the queue inside. When arrivals go back to 20/s, it still takes <b>150 s</b> to drain.',
        look: 'The columns rise with no ceiling up to 12,000 and only come down later, slowly. The queue turns red.',
        key: 'A queue with no limit hides the overload until it takes the process down.',
        f(o, t) { const s = lin(t, 0.4, 7.4, 0, 750), q = s <= 600 ? 20 * s : Math.max(0, 12000 - 80 * (s - 600)); lit(o, 'prod', 'proj'); o.on.fila = 'bad';
          o.rows.fila = act('projector queue', 'NO LIMIT', [thou(q) + ' events', 'bad'], [`delay: ${thou(q / 100)} s`, 'bad']); o.rows.fila.bar = [Math.min(1, q / 12000), thou(q), 'bad'];
          qcols(o, s, x => x <= 600 ? 20 * x : Math.max(0, 12000 - 80 * (x - 600)), 'bad'); pk(o, WAY.pf, (t * 0.35) % 1, '', 'bad');
          o.cnt = [['IN QUEUE', thou(q), 'bad'], ['DELAY', `${thou(q / 100)} s`, 'bad'], ['TIME', minsec(s), 'dim']];
          o.res = s > 600 ? [['draining at 80/s: 150 s', 'dim']] : [['nobody was told', 'bad']]; } },
    ],
  };
  // colunas da simulação dos 1.000 clientes até a janela atual
  function jcols(o, k, upto) {
    const [calls] = JIT[k], n = Math.floor(clamp(upto) * 100) + 1, x0 = 34, p = 8.3;
    for (let i = 0; i < 101; i++) { const h = i < n ? Math.max(i < n && calls[i] ? 1.2 : 0.4, 92 * calls[i] / 1000) : 0;
      if (h > 0) col(o, x0 + i * p, 6.2, h, i < 20 ? 'bad' : 'acc', 324, 40); }
    T(o, [x0 + 10 * p, 386, 6], 'PSP down', 'bad'); T(o, [x0 + 60 * p, 386, 6], '200/s · 20 per window', 'dim');
  }
  function jstep(k, title, nextName, code, story, look, key) {
    const [calls, cum] = JIT[k], peak = Math.max(...calls.slice(20));
    return { id: k, dur: 9, title, yk: 'THE WAIT', code, story, look, key, act: nextName ? [nextName, 'next strategy'] : null,
      f(o, t) { const u = lin(t, 0.4, 7.4, 0, 1), i = Math.floor(u * 100); lit(o, 'app'); o.on.pspa = i < 20 ? 'bad' : 1;
        if (i >= 20) o.rows.pspa = act('PSP', '200/s', ['up since 2.0 s', 'acc']);
        jcols(o, k, u); pk(o, WAY.long, (clk * 0.6) % 1, '', i < 20 ? 'bad' : '');
        let tot = 0, pk_ = 0; for (let j = 0; j <= i; j++) { tot += calls[j]; if (j >= 20) pk_ = Math.max(pk_, calls[j]); }
        o.cnt = [['CALLS', thou(tot), k === 'fixo' && tot > 20000 ? 'bad' : ''], ['PEAK/100 ms AFTER 2 s', i >= 20 ? thou(pk_) : '…', pk_ >= 500 ? 'bad' : 'dim'], ['FINISHED', `${thou(cum[i])} (${dec(i / 10, 1)} s)`, 'dim']];
        o.res = u >= 1 ? (k === 'exp' ? [['only 40 of 1,000 in time', 'bad'], ['jitter spreads the waves', 'acc']] : [[`peak ${thou(peak)} · ${thou(cum[100])} finished`, peak >= 500 ? 'bad' : 'acc']]) : [];
        if (u > 0.3) { let bi = 20; for (let j = 20; j <= i; j++) if (calls[j] > calls[bi]) bi = j; T(o, [34 + bi * 8.3 + 3, 340, 14 + 92 * calls[bi] / 1000], `peak ${thou(calls[bi])}`, calls[bi] >= 500 ? 'bad' : 'acc'); } } };
  }
  // breaker: as colunas por segundo (altura = chamadas ao PSP-A naquele segundo; plaquinha = falhas rápidas)
  function bstep(id, title, s0, s1, yk, code, story, look, key) {
    return { id, dur: 9, title, yk, code, story, look, key,
      f(o, t) { const s = lin(t, 0.4, 7.4, s0, s1), st = brkState(s), [calls, ff] = brkAt(s); lit(o, 'app'); o.sw = st;
        if (s < 90) pspSlow(o); else { o.on.pspa = 1; o.rows.pspa = act('PSP-A', '1 s', ['back: 180 ms', 'acc']); }
        o.on.pag = 1; o.rows.pag = act('pagamentos', '2.0 s', [st === 'open' ? 'fast failure' : st === 'half' ? '5 probes' : 'calls PSP-A', st === 'open' ? 'bad' : 'hi'], ['pool of 50', 'dim']);
        o.pool.n = s < 1.3 ? Math.min(30, 30 * s) : s < 2.4 ? Math.max(0, 30 - (s - 1.3) * 27) : st === 'half' ? 5 : s > 93.91 ? 5 : 0;
        const pass = st !== 'open'; bm(o, CAB.pa1, { on: pass, tone: s < 90 ? 'bad' : '' }); bm(o, CAB.pa2, { on: pass, tone: s < 90 ? 'bad' : '' });
        if (pass) pk(o, WAY.pa, (clk * 0.8) % 1, s < 90 ? '8,000 ms → timeout' : '180 ms', s < 90 ? 'bad' : '');
        for (let k = 0; k < 100 && k < s; k++) { const a = BRK[Math.min(BRK.length - 1, 2 * k)], b = BRK[Math.min(BRK.length - 1, 2 * k + 2)], c = b[0] - a[0], f = b[1] - a[1];
          if (c > 0) col(o, 34 + k * 8.4, 6.4, Math.max(2, 70 * c / 30), k < 93 ? 'bad' : 'acc', 324, 40); else if (f > 0) col(o, 34 + k * 8.4, 6.4, 1.2, 'dim', 324, 40); }
        T(o, [34 + 2 * 8.4, 386, 6], '0 s', 'dim'); T(o, [34 + 90 * 8.4, 386, 6], '90 s', 'dim');
        const NM = { closed: 'closed', open: 'open', half: 'half-open' };
        o.cnt = [['STATE', NM[st], st === 'open' ? 'bad' : ''], ['CLOCK', clock(s, 2)], ['CALLS TO PSP-A', thou(calls), 'dim']];
        if (s0 >= 1.3) o.cnt[2] = id === 'fecha' && s >= 99.5 ? ['CALLS TO PSP-A', '237 (without: 3,000)'] : ['FAST FAILURES', thou(ff), 'dim'];
        o.res = id === 'fecha' && s >= 99.5 ? [['237 calls instead of 3,000', 'acc'], ['2,763 fast failures', 'dim']] : st === 'open' ? [['nothing passes: fast failure', 'bad']] : st === 'half' ? [['testing with 5 probes', 'acc']] : [];
        T(o, [732, CY, 50], NM[st], st === 'open' ? 'bad' : 'acc'); } };
  }
  // degradação: barras da demanda e dos 4 níveis
  const LV = [['level 0', 1000], ['level 1', 1333], ['level 2', 1667], ['level 3 · CDN', 1950]];
  function dbars(o, demand, lv) {
    bars(o, [[`demand ${thou(demand)}`, demand, 2000, demand > LV[lv][1] ? 'bad' : 'acc'], ...LV.map(([n, v], i) => [i === 3 ? n : `${n} · ${thou(v)}`, v, 2000, i === lv ? 'acc' : 'dim'])], 480, 82, 50);
  }
  function dstep(lv, title, nextName, code, story, look, key) {
    return { id: 'n' + lv, dur: 6, title, yk: `LEVEL ${lv}`, code, story, look, key, act: [nextName, lv < 3 ? 'switches off more' : 'the "too late" variant'],
      f(o, t) { lit(o, 'app', 'gw', 'bff'); dbars(o, 1300, lv);
        const cdn = lv === 3; o.on.cat = cdn ? 0 : 1; if (cdn) { o.on.cdn = 1; pk(o, WAY.cdn, (t * 0.5) % 1, ''); } else pk(o, WAY.cat, (t * 0.5) % 1, '');
        const cap = [1000, 1333, 1667][lv] || 0;
        o.rows.cat = act('catalog', cdn ? 'OFF THE PATH' : `LEVEL ${lv}`, [cdn ? 'almost no traffic' : `${[10, 7.5, 6][lv].toString()} ms → ${thou(cap)} req/s`, 'dim'],
          ['recommendations: off', 'dim'], [lv >= 2 ? 'simplified search' : 'full search', lv >= 2 ? 'dim' : 'hi'], [lv >= 2 ? 'reviews: off' : 'reviews: on', lv >= 2 ? 'dim' : 'hi']);
        o.cnt = [['CAPACITY', cdn ? 'the CDN\'s' : `${thou(cap)} req/s`], ['DEMAND', '1,300 req/s', 'dim'], ['SWITCHED OFF', ['', 'recommendations', '+ search, reviews', 'everything except the storefront'][lv], 'dim']];
        o.res = [[lv === 1 ? 'the minimum level that holds' : cdn ? 'the CDN holds the storefront' : 'holds, with room to spare', 'acc']]; } };
  }
  // backpressure: a fila e as colunas do tamanho da fila no tempo (uma a cada 10 s, até 750 s, escala de 12.000)
  function fila(o, q, st) { o.rows.fila = act('projector queue', 'LIMIT 5,000', [`${thou(q)} events`, q >= 5000 ? 'bad' : 'hi'], [st, q >= 5000 ? 'bad' : 'dim']); o.rows.fila.bar = [q / 12000, thou(q), q >= 5000 ? 'bad' : 'acc', 5000 / 12000]; }
  function qcols(o, s, qf, tone = 'acc') {
    for (let k = 0; k * 10 <= s && k < 76; k++) { const q = qf(k * 10); col(o, 34 + k * 11, 8.4, Math.max(0.6, 92 * q / 12000), q >= 5000 && tone === 'acc' ? 'bad' : tone, 324, 40); }
    T(o, [34, 386, 6], '0 s', 'dim'); T(o, [34 + 25 * 11, 386, 6], '250 s', 'dim'); T(o, [34 + 60 * 11, 386, 6], '10 min', 'dim');
  }
  function pstep(id, title, nextName, yk, code, story, look, key, prodSt) {
    return { id, dur: 7, title, yk, code, story, look, key, act: [nextName, id === 'descartar' ? 'if it goes wrong' : 'another policy'],
      f(o, t) { lit(o, 'prod', 'proj'); o.on.fila = 1; fila(o, 5000, id === 'bloquear' ? 'full: the send waits' : id === '429' ? 'full: answers 429' : 'full: drops SHEDDABLE');
        o.rows.prod = act('Kafka', 'PRODUCER', ['order events', 'dim'], [prodSt, id === 'bloquear' ? 'acc' : 'bad']);
        qcols(o, 300, x => Math.min(5000, 20 * x));
        pk(o, WAY.pf, (t * 0.3) % 0.5 + 0.5, '100/s');
        if (id === 'bloquear') pk(o, WAY.pf, (t * 0.3) % 0.5, '');
        if (id === '429') { const f = (t * 0.45) % 1; pk(o, WAY.pf.slice(0, 4).reverse(), f, '429', 'bad'); }
        if (id === 'descartar') { pk(o, WAY.pf, (t * 0.3) % 0.4, 'order'); pk(o, WAY.pf.slice(0, 3), (t * 0.4 + 0.5) % 1, 'marketing', 'bad'); }
        o.cnt = [['IN QUEUE', '5,000'], ['GO IN', id === 'descartar' ? 'only what matters' : '100/s', 'dim'], ['SIGNAL', { bloquear: 'waiting', 429: '429 + Retry-After', descartar: 'refuses SHEDDABLE' }[id], 'dim']];
        o.res = [['the overload becomes a signal', 'acc']]; } };
  }
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
  function head(x, u, d, W_, col_, s1 = 11) {
    const y = s1 > 15 ? 13 : 11;
    x.textAlign = 'left'; x.fillStyle = col_; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.62 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col_; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 14); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col_ = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    head(x, u, d, W_, col_, cf.s1); const ly = cf.s1 > 15 ? 25 : 21;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.bar) {   // barra de enchimento (a fila): [fração, rótulo, tom, marca do limite]
      const [f, lab, tn, mk] = d.bar, bx = 5, bw = W_ - 10, bh = 20, by = H_ - bh - 6, light = theme === 'light';
      x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(bx), u(by), u(bw), u(bh));
      x.fillStyle = tn === 'bad' ? BAD() : accC(); x.fillRect(u(bx), u(by), u(bw * clamp(f)), u(bh));
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(bx), u(by), u(bw), u(bh));
      if (mk) { x.strokeStyle = BAD(); x.lineWidth = u(1.4); x.beginPath(); x.moveTo(u(bx + bw * mk), u(by - 3)); x.lineTo(u(bx + bw * mk), u(by + bh + 3)); x.stroke(); }
      x.textAlign = 'left'; x.fillStyle = f > 0.3 ? (light ? '#f6f6f5' : '#141516') : INK(); fitFont(x, u, lab, 12, bw * 0.5); x.fillText(lab, u(bx + 4), u(by + bh / 2 + 0.5));
    }
    cv.tex.needsUpdate = true;
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
    lbl(s.yk || 'THE MATH', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (...i) => i.includes(step) ? ' class="on"' : '';
  const DATA = {
    timeout: () => `<table class="h3-sum"><tr><th>timeout</th><th>in flight (30/s)</th><th>pool of 50</th></tr><tr${on_(0)}><td>180 ms (normal)</td><td>5.4</td><td>room to spare</td></tr><tr${on_(3)}><td>1.0 s</td><td>30</td><td>fits</td></tr><tr><td>1.67 s</td><td>50</td><td>critical timeout</td></tr><tr${on_(2)}><td>2.0 s</td><td>60</td><td>saturates · 484 refused in 100 s</td></tr><tr${on_(1)}><td>8.0 s</td><td>240</td><td>saturates in 1.67 s</td></tr></table><li>PSP-A latency (example): p50 <b>180 ms</b>, p99 <b>400 ms</b>, p99.9 <b>700 ms</b>; 0.1% false timeouts → p99.9 + margin = <b>1 s</b> (AWS)</li><li>Deadlines: app 5 s › <code>gw-loja</code> 3 s › <code>bff-app</code> 2.8 s › <code>pedidos</code> 2.5 s › <code>pagamentos</code> 2.0 s › PSP 1.0 s per attempt</li><li><code>Idempotency-Key: "3f9a2c7e-5b1d-4e8a-9c3f-7a2b4d6e8f10"</code> + CRLF = <b>57 B</b></li><li>PostgreSQL 14.24: 1st arrival <code>INSERT 0 1</code>; repeat <code>INSERT 0 0</code> and the stored response (<code>201</code>, <code>pedido_id 1058</code>); different body → <code>422</code>; still processing → the concurrent <code>INSERT</code> waits for the first one's commit</li><li>Stripe keeps the key for at least 24 h and accepts up to 255 characters</li>`,
    retry: () => `<table class="h3-sum"><tr><th>layers × attempts</th><th>per click</th><th>at 30/s</th></tr><tr${on_(1, 2)}><td>3 × 3</td><td>27</td><td>810/s (20.2 × 40/s)</td></tr><tr${on_(2)}><td>3 × 2</td><td>8</td><td>240/s</td></tr><tr${on_(2, 3)}><td>1 × 3</td><td>3</td><td>90/s</td></tr><tr${on_(4)}><td>10% budget</td><td>1.1</td><td>33/s</td></tr></table><li>Exponential backoff with a 100 ms base: waits of 100, 200, 400, 800, 1,600 ms (at 0.1 · 0.3 · 0.7 · 1.5 · 3.1 s)</li><li>Retries only on <code>503</code>, <code>504</code>, timeout and connection refused, and only with <code>Idempotency-Key</code></li><li>Google SRE: per-process budget, example of 60 retries per minute</li><li>Metastable failure: Bronson et al., HotOS 2021 (link not checked)</li>`,
    jitter: () => `<table class="h3-sum"><tr><th>strategy</th><th>calls</th><th>peak</th><th>refused*</th><th>finished</th></tr><tr${on_(1)}><td>fixed 100 ms</td><td>45,500</td><td>1,000</td><td>24,500</td><td>1,000</td></tr><tr${on_(5)}><td>exp. no jitter</td><td>6,980</td><td>1,000</td><td>1,940</td><td>40</td></tr><tr${on_(2)}><td>full jitter</td><td>7,540</td><td>84</td><td>687</td><td>1,000</td></tr><tr${on_(3)}><td>equal jitter</td><td>7,162</td><td>130</td><td>1,085</td><td>993</td></tr><tr${on_(4)}><td>decorrelated</td><td>7,590</td><td>125</td><td>1,397</td><td>999</td></tr></table><li>* refused with the PSP already up; peak = largest 100 ms window after the PSP is back</li><li>Simulation (Python, seed 7): 1,000 clients at t = 0; PSP down until 2.0 s, then 200/s; 10 s deadline; base 100 ms; cap 5 s</li><li>AWS Architecture Blog, "Exponential Backoff And Jitter": no jitter is "the clear loser"; the order between <i>equal</i> and <i>full</i> is only from this scenario</li><li><b>Correction to the article:</b> "incremental jitter" (0–4 s, 2–6 s, 6–10 s) is none of the three algorithms; it lacks the cap and the waves of backoff with no jitter</li>`,
    breaker: () => `<table class="h3-sum"><tr><th>moment</th><th>state</th></tr><tr${on_(1)}><td>1.3 s</td><td>opens</td></tr><tr${on_(3)}><td>31.3 → 32.43 s</td><td>half-open → reopens</td></tr><tr${on_(3)}><td>62.47 → 63.6 s</td><td>half-open → reopens</td></tr><tr${on_(4)}><td>90 s</td><td>PSP-A is back</td></tr><tr${on_(4)}><td>93.6 → 93.91 s</td><td>half-open → closes</td></tr></table><li>Simulation: 30 req/s for 100 s, PSP-A at 8 s until 90 s, pool of 50, 1 s timeout. Calls to PSP-A: <b>237</b> (54 during the failure, 183 after) against <b>3,000</b> with no breaker; fast failures: <b>2,763</b></li><li>No breaker: 2 s timeout → 484 refused by the pool; 8 s timeout → 2,260. With breaker and a 2 s timeout: opens at 2.3 s and 11 are still refused</li><li>Resilience4j (defaults): <code>failureRateThreshold</code> 50, <code>slidingWindowSize</code> 100, <code>minimumNumberOfCalls</code> 100, <code>waitDurationInOpenState</code> 60 s, <code>permittedNumberOfCallsInHalfOpenState</code> 10, <code>slowCallDurationThreshold</code> 60 s. The store: window 20, minimum 10, 30 s, 5 probes, slow = &gt; 1 s</li>`,
    fallback: () => `<table class="h3-sum"><tr><th>fallback</th><th>sacrifices</th><th>in the store</th></tr><tr${on_(1)}><td>reactive</td><td>latency</td><td>PSP-B (300 ms × 180 ms)</td></tr><tr${on_(2)}><td>fallback value</td><td>precision</td><td>table shipping rate: Rio 12.00</td></tr><tr${on_(2)}><td>contractual</td><td>cost</td><td>R$ 0.10 × R$ 0.03: +R$ 1,260 in 10 min</td></tr><tr${on_(3)}><td>proactive</td><td>1% of the traffic</td><td>0.3/s = 18/min at PSP-B</td></tr></table><li>Order 1058 (Caio, Rio, 20:20:04): 3 blue mugs 59.70 + shipping 12.00 = <b>71.70</b>, card; mug 35 → 32</li><li>AWS, "Avoiding fallback in distributed systems": a rarely exercised fallback has a latent defect and can make the failure worse; "continuously exercised code paths"</li><li>Snapshot (credit limit from the last known value) and asynchronous flow (email to the queue) are the article's other fallbacks</li>`,
    degradacao: () => `<table class="h3-sum"><tr><th>level</th><th>CPU/page</th><th>per replica</th><th>10 replicas</th></tr><tr${on_(0, 1, 5)}><td>0 · normal</td><td>10 ms</td><td>100 req/s</td><td>1,000</td></tr><tr${on_(2)}><td>1 · no recommendations</td><td>7.5 ms</td><td>133</td><td>1,333</td></tr><tr${on_(3)}><td>2 · + simple search, no reviews</td><td>6 ms</td><td>167</td><td>1,667</td></tr><tr${on_(4)}><td>3 · static page</td><td>CDN</td><td>—</td><td>the CDN's</td></tr></table><li>Burst of <b>1,300 req/s</b> for a few seconds at 20:20 (the newsletter); the peak measured in module 14 is 640 and the projected one, 950</li><li>HPA: 10 → 14 replicas = 1,400 req/s, but it takes minutes</li><li>Criticality (Google SRE): <code>CRITICAL_PLUS</code>, <code>CRITICAL</code>, <code>SHEDDABLE_PLUS</code>, <code>SHEDDABLE</code>; checkout › catalog › recommendations and "my orders" › reports</li>`,
    backpressure: () => `<table class="h3-sum"><tr><th>policy</th><th>what happens</th></tr><tr${on_(1)}><td>queue of 5,000</td><td>fills in 250 s; max delay 50 s; drains in 62.5 s</td></tr><tr${on_(2)}><td>block</td><td>the producer moves at 100/s</td></tr><tr${on_(3)}><td><code>429</code> + <code>Retry-After</code></td><td>the producer waits the requested time</td></tr><tr${on_(4)}><td>drop by priority</td><td>refuses <code>SHEDDABLE</code> first</td></tr><tr${on_(5)}><td>unbounded</td><td>10 min: 12,000, 120 s of delay; drains in 150 s</td></tr></table><li>120 events/s arrive, the <code>meus-pedidos</code> projector processes 100/s: deficit of 20/s</li><li>RFC 6585 (<code>429</code>) and RFC 9110 (<code>Retry-After</code>); Reactive Streams: <code>request(n)</code></li><li><b>Correction to the article:</b> "queueing in memory" with no limit is not backpressure; it hides the overload</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo: avança para o passo seguinte
  function actHtml() { const a = cur().act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'chamadas') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'chamadas' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-chamadas3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'chamadas') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
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
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    // colunas
    if (theme === 'light') { colMats.acc.color.copy(accent).multiplyScalar(0.85); colMats.bad.color.set(0xc23a2c); colMats.dim.color.set(0xa9aeb2);
      Object.values(colMats).forEach(m => m.emissiveIntensity = 0); }
    else { Object.values(colMats).forEach(m => m.color.set(0x1b1c1f)); colMats.acc.emissive.copy(accent); colMats.acc.emissiveIntensity = 0.55;
      colMats.bad.emissive.copy(badEm); colMats.bad.emissiveIntensity = 0.5; colMats.dim.emissive.set(0x8a9099); colMats.dim.emissiveIntensity = 0.32; }
    COLS.forEach((m, i) => { const c = o.cols[i]; if (!c) { m.visible = false; return; }
      m.visible = true; m.material = colMats[c.tone] || colMats.dim; m.position.copy(W(c.x, c.y, PL)); m.scale.set(c.w * TS, c.h * TS, c.d * TS); });
    // pool: 50 encaixes; ocupados sobem e acendem
    SLOTS.forEach((S, i) => { const busy = o.pool && i < Math.round(o.pool.n), want = o.pool ? (busy ? 11 : 2) : 0;
      S.h += (want - S.h) * Math.min(1, dt / 0.12); S.m.visible = !!o.pool;
      S.m.material = busy ? (o.pool.bad ? colMats.bad : colMats.acc) : colMats.dim; S.m.position.copy(W(S.x, S.y, PL)); S.m.scale.set(11 * TS, Math.max(0.5, S.h) * TS, 19 * TS); });
    // disjuntor
    SWG.visible = !!o.sw; const ang = o.sw === 'open' ? 0.95 : o.sw === 'half' ? 0.45 + 0.08 * Math.sin(clk * 8) : 0;
    swAng += (ang - swAng) * Math.min(1, dt / 0.15); pivot.rotation.z = swAng;
    swMat.color.copy(o.sw === 'open' ? new THREE.Color(BAD()) : accent);
    moveGlow(swGlow, [732, CY, PL + 24], o.sw ? (o.sw === 'open' ? 0.35 : 0.6) : 0);
    drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
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
      const [x0, x1, y0, y1] = [24, 880, 20, 446];
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
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
