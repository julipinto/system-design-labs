// Figura 3D (iso-glow): a chamada que atravessa a loja. Atrás, em linha, app → gw-loja → bff-app → pedidos → pagamentos → PSP-A,
// com o PSP-B na frente do A; o disjuntor é o interruptor do elo pagamentos → PSP-A; os 50 encaixes na frente do pagamentos são o pool.
// Na faixa da frente, colunas: a rajada de chamadas a cada 100 ms (jitter), as chamadas por segundo (breaker), as barras de capacidade
// (retry, degradação) e a fila no tempo (backpressure). Atrás, suspenso, o mostrador (a conta do passo e o resultado).
// Cenários (botões e ?mode=timeout|retry|jitter|breaker|fallback|degradacao|backpressure; ?step=N abre no passo N).
// Dados: docs/escrita/resiliencia-brief.md e as aulas 1, 5–11 (pedido 1058 do Caio, PSP-A em 8 s das 20:20:00 às 20:21:30, pool de 50 a 30/s,
// timeout de 1 s, prazos 5/3/2,8/2,5/2,0/1,0 s, 27 chamadas por clique, a simulação dos 1.000 clientes (semente 7) e a do breaker (237 × 3.000),
// PSP-B p50 300 ms e 1% proativo, rajada de 1.300 req/s e níveis 1.000/1.333/1.667, fila de 5.000 que enche em 250 s e drena em 62,5 s).
FIGS3D.push({ id: 'chamadas', name: 'A chamada que atravessa a loja', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (n, d = 1) => { const [a, b] = n.toFixed(d).split('.'); return thou(+a) + (b ? ',' + b : ''); };
  // segundos depois das 20:20:00 → 20:20:01,3
  const clock = (s, d = 1) => { const v = Math.max(0, s), m = Math.floor(v / 60), r = v - m * 60;
    let ss = r.toFixed(d); if (+ss >= 60) ss = (59.9).toFixed(d); const [a, b] = ss.split('.');
    return `20:${20 + m}:${a.padStart(2, '0')}${b ? ',' + b : ''}`; };
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
  const SCNAME = { timeout: 'Timeout', retry: 'Retry', jitter: 'Jitter', breaker: 'Breaker', fallback: 'Fallback', degradacao: 'Degradação', backpressure: 'Backpressure' };
  const SCFULL = { timeout: 'Timeout, prazos e chave', retry: 'Tempestade de retries', jitter: 'Backoff e jitter', breaker: 'Circuit breaker',
    fallback: 'Fallback', degradacao: 'Degradação', backpressure: 'Backpressure' };
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
    o.rows.app = act('app', '5 s', ['Caio · 1058', 'hi'], ['3 canecas', 'dim'], ['+ frete 71,70', 'dim']);
    o.rows.gw = act('gw-loja', '3 s', ['entrada', 'dim']);
    o.rows.bff = act('bff-app', '2,8 s', ['monta a tela', 'dim']);
    o.rows.ped = act('pedidos', '2,5 s', ['pedido 1058', 'dim'], ['caneca 35 → 32', 'dim']);
    o.rows.pag = act('pagamentos', '2,0 s', ['2 réplicas × 20/s', 'dim'], ['pool de 50', 'dim']);
    o.rows.pspa = act('PSP-A', '1 s', ['p50 180 ms', 'dim'], ['cobra o cartão', 'dim']);
    o.rows.pspb = act('PSP-B', 'RESERVA', ['p50 300 ms', 'dim']);
    o.rows.idem = act('idempotencia', 'TABELA', ['chave · estado · resposta', 'dim']);
    o.rows.cat = act('catálogo', '10 RÉPLICAS', ['100 req/s cada = 1.000', 'dim'], ['recomendações: ligadas', 'hi'], ['busca completa', 'hi'], ['avaliações: ligadas', 'hi']);
    o.rows.cdn = act('CDN', 'MÓD. 5', ['vitrine', 'dim'], ['estática', 'dim']);
    o.rows.prod = act('Kafka', 'PRODUTOR', ['eventos de pedidos', 'dim'], ['chegam 120/s', 'hi']);
    o.rows.fila = act('fila do projetor', 'LIMITE 5.000', ['vazia', 'dim']); o.rows.fila.bar = [0, '0', 'acc'];
    o.rows.proj = act('meus-pedidos', 'PROJETOR', ['100/s', 'hi']);
    if (sc === 'jitter') { o.rows.app = act('clientes', '1.000', ['chamam juntos', 'hi'], ['em t = 0', 'dim']); o.rows.pspa = act('PSP', '200/s', ['fora até 2,0 s', 'bad']); }
    if (sc === 'degradacao') o.rows.app = act('app', 'VITRINE', ['catálogo', 'dim']);
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
  const pspSlow = (o, txt = 'responde em 8 s') => { o.on.pspa = 'bad'; o.rows.pspa = act('PSP-A', '1 s', [txt, 'bad'], ['20:20:00 → 21:30', 'dim']); };
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
      { id: 'normal', dur: 5, title: 'Dia normal: 210 ms do clique ao PSP', yk: 'LEI DE LITTLE', act: ['PSP-A em 8 s', '20:20:00'],
        code: ['em voo = taxa × tempo', '30/s × 0,18 s = 5,4 conexões', 'o pool tem 50: sobra', 'caminho: 5 + 20 + 5 + 180 = 210 ms'],
        story: 'Do app do Caio até o PSP-A, o pagamento passa por <code>gw-loja</code>, <code>bff-app</code>, <code>pedidos</code> e <code>pagamentos</code>. Num dia normal a volta leva <b>210 ms</b>. O <code>pagamentos</code> fala com o PSP-A por um <b>pool de 50 conexões</b>. A 30 pedidos/s, com o PSP respondendo em 180 ms, só <b>5,4</b> conexões ficam ocupadas ao mesmo tempo (Lei de Little: 30 × 0,18).',
        look: 'Os 50 encaixes na frente do pagamentos são o pool. Uns cinco acendem; o resto fica vazio.',
        key: 'Em voo = taxa × tempo: com o PSP rápido, o pool sobra.',
        f(o, t) { lit(o, 'app', 'pag'); const f = (t * 0.3) % 1; pk(o, WAY.full, f, `${Math.round(210 * f)} ms`);
          o.pool.n = 5 + (Math.sin(clk * 3) > 0.3 ? 1 : 0);
          o.cnt = [['EM VOO NO POOL', '5,4 de 50'], ['DO CLIQUE AO PSP', '210 ms', 'dim'], ['PSP-A p50', '180 ms', 'dim']];
          o.res = [['pool quase vazio', 'acc']]; T(o, [623, 300, 22], 'pool de 50', 'dim'); } },
      { id: 'lento', dur: 7, title: 'PSP-A em 8 s: o pool esgota em 1,67 s', yk: 'TIMEOUT DE 8 s', act: ['Timeout 2 s', 'o do módulo 10'],
        code: ['30/s × 8 s = 240 em voo', 'o pool tem 50', 'esgota em 50 ÷ 30 = 1,67 s', 'vazão máxima: 50 ÷ 8 = 6,25/s', 'o resto é recusado'],
        story: 'Às <b>20:20:00</b> o PSP-A passa a responder em <b>8 s</b> e fica assim por 90 s. Se o <code>pagamentos</code> espera os 8 s, cada conexão fica presa 8 s. Chegam 30 pedidos por segundo: em <b>1,67 s</b> as 50 conexões estão ocupadas e nenhuma resposta voltou. Daí em diante todo pagamento é recusado pelo pool. O checkout inteiro para por causa de uma dependência lenta.',
        look: 'Os encaixes acendem um a um até os 50 ficarem vermelhos. O PSP-A fica vermelho e as chamadas param no meio do cabo.',
        key: 'Uma dependência lenta prende conexões, e conexão presa esgota o pool.',
        f(o, t) { const s = lin(t, 0.4, 5.4, 0, 3), n = Math.min(50, 30 * s), full = s >= 50 / 30; lit(o, 'app');
          pspSlow(o); o.on.pag = full ? 'bad' : 1; o.pool.n = n; o.pool.bad = full;
          for (let k = 0; k < 3; k++) pk(o, WAY.pa, clamp((s - k * 0.6) / 8 * 0.9 + 0.05, 0, 0.95), k === 0 ? `${thou((s) * 1000)} ms` : '', 'bad');
          bm(o, CAB.pa, { on: true, tone: 'bad' });
          o.cnt = [['EM VOO', `${Math.floor(n)} de 50`, full ? 'bad' : ''], ['RELÓGIO', clock(s, 2)], ['RECUSADAS', thou(Math.max(0, 30 * (s - 50 / 30))), full ? 'bad' : 'dim']];
          o.res = full ? [['pool esgotado em 1,67 s', 'bad'], ['todo pagamento recusado', 'bad']] : [['enchendo…', 'dim']];
          if (full) T(o, [623, 300, 24], 'pool cheio', 'bad'); } },
      { id: 't2', dur: 7, title: 'Timeout de 2 s: ainda satura', yk: 'TIMEOUT DE 2 s', act: ['Timeout 1 s', 'p99,9 + folga'],
        code: ['30/s × 2 s = 60 em voo', '60 > 50: satura', 'esgota em 1,67 s, como antes', 'vazão máxima: 50 ÷ 2 = 25/s', 'em 100 s: 484 recusadas pelo pool'],
        story: 'O módulo 10 usava timeout de <b>2 s</b>. Parece prudente, mas a conta não fecha: 30 pedidos/s × 2 s = <b>60</b> conexões em voo, e o pool tem 50. O pool esgota no mesmo 1,67 s e passa a recusar o que sobra. Simulando os 100 s do incidente, <b>484</b> pagamentos são recusados pelo pool.',
        look: 'O pool enche de novo até o fim; desta vez as conexões soltam a cada 2 s, mas entram mais do que saem.',
        key: 'Um timeout acima de pool ÷ taxa satura o pool do mesmo jeito.',
        f(o, t) { const s = lin(t, 0.4, 5.4, 0, 3), n = Math.min(50, 30 * s), full = s >= 50 / 30; lit(o, 'app');
          pspSlow(o); o.on.pag = full ? 'bad' : 1; o.pool.n = n; o.pool.bad = full; o.rows.pag.rows.push(['timeout 2 s', 'hi']);
          pk(o, WAY.pa, clamp((s % 2) / 2, 0.02, 0.98), `${thou((s % 2) * 1000)} ms`, 'bad'); bm(o, CAB.pa, { on: true, tone: 'bad' });
          o.cnt = [['EM VOO', '60 > 50', full ? 'bad' : ''], ['ESGOTA EM', '1,67 s', 'dim'], ['RECUSADAS EM 100 s', '484', 'bad']];
          o.res = full ? [['satura do mesmo jeito', 'bad']] : [['enchendo…', 'dim']];
          if (full) T(o, [623, 300, 24], 'pool cheio', 'bad'); } },
      { id: 't1', dur: 7, title: 'Timeout de 1 s: 30 em voo, cabe', yk: 'POR QUE 1 s',
        code: ['PSP-A: p50 180 · p99 400 · p99,9 700 ms', 'aceitar 0,1% de falsos timeouts → p99,9', '700 ms + folga = 1 s', '30/s × 1 s = 30 em voo ≤ 50', 'timeout crítico: 50 ÷ 30 = 1,67 s'],
        story: 'O timeout certo sai de um <b>percentil</b>. Aceitando 0,1% de falsos timeouts, a AWS manda olhar o p99,9 do PSP-A (700 ms) e somar uma folga: <b>1 s</b>. A Lei de Little confere: 30 × 1 = <b>30</b> em voo, abaixo dos 50. Com o PSP lento cada pagamento ainda falha, mas falha em 1 s, e o <code>pagamentos</code> fica de pé para tentar outra coisa (o PSP-B da aula 9).',
        look: 'O pool para em 30 encaixes acesos e 20 vazios. As chamadas ao PSP-A voltam em vermelho depois de 1.000 ms.',
        key: 'Timeout tirado do percentil e conferido com pool ÷ taxa: 1 s, abaixo dos 1,67 s.',
        f(o, t) { const s = lin(t, 0.4, 4.4, 0, 3), n = Math.min(30, 30 * s); lit(o, 'app', 'pag');
          pspSlow(o); o.pool.n = n; o.rows.pag.rows.push(['timeout 1 s', 'acc']);
          pk(o, WAY.pa, clamp(s % 1, 0.02, 0.98), `${thou((s % 1) * 1000)} ms`, 'bad'); bm(o, CAB.pa, { on: true, tone: 'bad' });
          o.cnt = [['EM VOO', `${Math.floor(n)} de 50`], ['TIMEOUT CRÍTICO', '1,67 s', 'dim'], ['RECUSADAS PELO POOL', '0', 'dim']];
          o.res = [['cabe: sobram 20 conexões', 'acc'], ['cada chamada lenta falha em 1 s', 'dim']];
          T(o, [623, 300, 22], '30 de 50', 'acc'); } },
      { id: 'prazos', dur: 6, title: 'Os prazos em cadeia: quem está fora espera mais', yk: 'A SOMA DAS TENTATIVAS',
        code: ['app 5 > gw-loja 3 > bff-app 2,8', '> pedidos 2,5 > pagamentos 2,0 > PSP 1,0', '3 tentativas × 1 s + 0,1 + 0,2 = 3,3 s', '3,3 s > 3 s do gw-loja', 'só tenta de novo se sobrar prazo'],
        story: 'Cada elo espera <b>mais</b> que o de dentro: app <b>5 s</b>, <code>gw-loja</code> <b>3 s</b>, <code>bff-app</code> <b>2,8 s</b>, <code>pedidos</code> <b>2,5 s</b>, <code>pagamentos</code> <b>2,0 s</b> e o PSP <b>1,0 s por tentativa</b>. Assim quem está dentro desiste primeiro e responde a tempo de quem chamou. Três tentativas de 1 s com as esperas de 0,1 e 0,2 s somam <b>3,3 s</b>, mais que os 3 s do <code>gw-loja</code>: a terceira tentativa nunca chegaria a ninguém.',
        look: 'Na frente, uma escada: cada coluna é o prazo de uma caixa, e ela desce da esquerda para a direita.',
        key: 'O prazo de fora é maior que o de dentro, e a soma das tentativas cabe no prazo de quem chamou.',
        f(o, t) { const f = lin(t, 0.3, 2.5, 0, 1); lit(o, 'app', 'gw', 'bff', 'ped', 'pag', 'pspa');
          [['app', 5], ['gw', 3], ['bff', 2.8], ['ped', 2.5], ['pag', 2.0], ['pspa', 1.0]].forEach(([nm, v], i) => { const w = 44, x = Cx(nm) - w / 2;
            col(o, x, w, Math.max(1.5, 90 * v / 5 * clamp(f * 6 - i)), 'acc', 300, 44); if (f * 6 - i > 0.6) T(o, [x + w / 2, 368, 8], dec(v, v % 1 ? 1 : 0) + ' s', 'acc'); });
          o.cnt = [['APP', '5 s'], ['gw-loja', '3 s', 'dim'], ['PSP', '1 s por tentativa', 'dim']];
          o.res = [['de fora > de dentro', 'acc'], ['3,3 s não cabe nos 3 s', 'bad']]; } },
      { id: 'orfao', dur: 9, title: 'E se der errado: o gw-loja desiste e a c-7731 já existe', yk: 'O TIMEOUT NÃO CANCELA', act: ['Repetir sem chave', 'o app refaz o POST'],
        code: ['2,0 s: pagamentos para de esperar', '3,0 s: gw-loja devolve erro ao app', '8,0 s: o PSP termina a cobrança', 'c-7731 existe e ninguém soube', 'timeout = "parei de esperar"'],
        story: 'O timeout só diz "parei de esperar", não "não aconteceu". No módulo 12 o PSP demorou <b>8 s</b>, o <code>pagamentos</code> desistiu em 2 s e o <code>gw-loja</code> devolveu erro ao app em 3 s. Do outro lado o PSP seguiu trabalhando e criou a cobrança <code>c-7731</code>. O Caio vê "erro" e o cartão foi cobrado. É trabalho órfão: feito para ninguém.',
        look: 'O gw-loja e o app ficam vermelhos com o erro, mas a luz continua no PSP-A até a c-7731 aparecer.',
        key: 'Desistir de esperar não desfaz o que o outro lado já está fazendo.',
        f(o, t) { const s = lin(t, 0.4, 7.4, 0, 8.4); lit(o, 'pspa'); pspSlow(o, 'processando…');
          const pagGave = s >= 2, gwGave = s >= 3, made = s >= 8;
          o.on.pag = pagGave ? 'bad' : 1; o.on.gw = gwGave ? 'bad' : 1; o.on.app = gwGave ? 'bad' : 1;
          if (pagGave) o.rows.pag = act('pagamentos', '2,0 s', ['desistiu em 2 s', 'bad'], ['erro para o pedidos', 'dim']);
          if (gwGave) { o.rows.gw = act('gw-loja', '3 s', ['erro ao app', 'bad']); o.rows.app = act('app', '5 s', ['Caio vê erro', 'bad'], ['1058?', 'dim']); }
          if (made) o.rows.pspa = act('PSP-A', 'COBROU', ['c-7731 criada', 'bad'], ['71,70 no cartão', 'bad']);
          pk(o, WAY.toPag, s / 0.25, '');
          if (!made) { bm(o, CAB.pa, { on: true, tone: pagGave ? 'bad' : '' }); pk(o, WAY.pa, clamp(0.15 + s / 8 * 0.8, 0, 0.95), `${thou(s * 1000)} ms`, pagGave ? 'bad' : ''); }
          if (gwGave) pk(o, WAY.gwBack, lin(s, 3, 4, 0, 1), 'erro', 'bad');
          o.cnt = [['RELÓGIO', clock(4 + s, 1)], ['O APP VÊ', gwGave ? 'erro' : '…', gwGave ? 'bad' : 'dim'], ['NO PSP', made ? 'c-7731 cobrada' : 'processando', made ? 'bad' : 'dim']];
          o.res = made ? [['erro no app, cobrança no cartão', 'bad'], ['trabalho órfão', 'bad']] : gwGave ? [['o gw-loja desistiu', 'bad']] : [];
          if (made) T(o, [823, 160, 34], 'c-7731 já existe', 'bad'); } },
      { id: 'semchave', dur: 7, title: 'O app repete o POST sem chave: dois pedidos', yk: 'SEM IDEMPOTÊNCIA', act: ['Repetir com chave', 'Idempotency-Key'],
        code: ['POST /pedidos   (1ª vez: resposta perdida)', 'POST /pedidos   (o app tenta de novo)', 'o pedidos não sabe que é a mesma compra', 'cria outro pedido, outra cobrança', '2 pedidos, 2 cobranças de 71,70'],
        story: 'O app do Caio não recebeu resposta e faz o que todo app faz: tenta de novo. Sem nada que diga "é a mesma compra", o <code>pedidos</code> trata a repetição como compra nova. Nascem <b>dois pedidos</b> e duas cobranças de 71,70, como no app do Davi no módulo 12. Um <b>UUID novo a cada tentativa</b> dá no mesmo: cada tentativa parece outra compra.',
        look: 'Duas luzes descem o caminho; o pedidos mostra o 1058 e um segundo pedido em vermelho.',
        key: 'Repetir sem idempotência duplica o efeito.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.6, 4.6, 0, 1); lit(o, 'app', 'gw', 'bff');
          o.on.ped = f2 >= 1 ? 'bad' : 1; o.rows.ped = act('pedidos', '2,5 s', ['1058 · 71,70', 'acc'], f2 >= 1 ? ['1059 · 71,70 de novo', 'bad'] : ['', 'dim']);
          pk(o, WAY.toPed, f1, 'POST 1'); pk(o, WAY.toPed, f2, 'POST 2', 'bad');
          o.cnt = [['PEDIDOS CRIADOS', f2 >= 1 ? '2' : f1 >= 1 ? '1' : '0', f2 >= 1 ? 'bad' : ''], ['COBRANÇAS', f2 >= 1 ? '2' : f1 >= 1 ? '1' : '0', f2 >= 1 ? 'bad' : 'dim'], ['CHAVE', 'nenhuma', 'dim']];
          o.res = f2 >= 1 ? [['a mesma compra, duas vezes', 'bad']] : [];
          if (f2 >= 1) T(o, [468, 160, 34], 'duplicado (hipotético)', 'bad'); } },
      { id: 'comchave', dur: 8, title: 'Com Idempotency-Key: o mesmo 1058 de volta', yk: 'TABELA idempotencia (PostgreSQL 14)',
        code: ['INSERT … ON CONFLICT (chave) DO NOTHING', '  RETURNING chave', '1ª chegada: INSERT 0 1 → cria o 1058', 'repetição: INSERT 0 0', '→ devolve 201 · pedido_id 1058'],
        story: 'Agora o app gera a chave <b>uma vez</b> por compra e a manda em todas as tentativas: <code>Idempotency-Key: "3f9a2c7e-5b1d-4e8a-9c3f-7a2b4d6e8f10"</code>, 57 bytes a mais no cabeçalho. O <code>pedidos</code> tenta gravar a chave na tabela <code>idempotencia</code>. Na primeira chegada o <code>INSERT … ON CONFLICT DO NOTHING</code> devolve 1 linha e o pedido é criado. Na repetição devolve 0 linhas, e o serviço responde o que guardou: <code>201</code>, pedido <b>1058</b>.',
        look: 'A tabela acende na frente do pedidos. A segunda luz bate nela e volta com o mesmo 1058; o pedidos continua com um pedido só.',
        key: 'A chave nasce uma vez por intenção; repetir devolve a resposta guardada.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.8, 4.8, 0, 1), fi = lin(t, 4.8, 5.8, 0, 1); showX(o, 'idem'); lit(o, 'app', 'gw', 'bff', 'ped');
          o.rows.ped = act('pedidos', '2,5 s', ['1058 · 71,70', 'acc'], ['um pedido só', 'dim']);
          o.on.idem = 1; o.rows.idem = act('idempotencia', 'TABELA', ['3f9a2c7e-… · concluido', 'acc'], ['{"status":201,', 'hi'], [' "pedido_id":1058}', 'hi'], [f2 >= 1 ? 'repetição: INSERT 0 0' : '1ª: INSERT 0 1', f2 >= 1 ? 'acc' : 'dim']);
          bm(o, CAB.pi, { on: true }); pk(o, WAY.toPed, f1, 'POST · chave'); pk(o, WAY.toPed, f2, 'POST · mesma chave'); pk(o, WAY.pi, fi, '201 · 1058');
          o.cnt = [['PEDIDOS CRIADOS', f1 >= 1 ? '1' : '0'], ['CABEÇALHO', '+57 B', 'dim'], ['RESPOSTA', f2 >= 1 ? '201 · 1058' : '…', 'dim']];
          o.res = f2 >= 1 ? [['o mesmo 1058 de volta', 'acc'], ['corpo diferente: 422', 'dim']] : []; } },
      { id: 'chave-nova', dur: 7, title: 'E se der errado: uma chave nova a cada tentativa', yk: 'A CHAVE NASCE NO LUGAR ERRADO',
        code: ['tentativa 1: chave 3f9a2c7e-…', 'tentativa 2: chave nova (outro UUID)', 'INSERT 0 1 e INSERT 0 1', 'duas "primeiras chegadas"', 'a chave nasce uma vez por compra'],
        story: 'A tabela só ajuda se a chave for a mesma. Se o app gera um UUID <b>a cada tentativa</b>, a repetição chega com outra chave, o <code>INSERT</code> devolve 1 linha de novo e o pedido é criado outra vez. A chave tem de nascer quando o Caio aperta "pagar", não quando o código manda a requisição. O outro furo: a chave é reservada e o processo cai antes de guardar a resposta; a repetição acha <code>processando</code> para sempre, e alguém precisa de um prazo para decidir.',
        look: 'A tabela ganha duas linhas, cada uma com uma chave, e o pedidos volta a ter dois pedidos em vermelho.',
        key: 'Chave nova a cada tentativa é o mesmo que não ter chave.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.6, 4.6, 0, 1), dup = f2 >= 1; showX(o, 'idem'); lit(o, 'app', 'gw', 'bff');
          o.on.ped = dup ? 'bad' : 1; o.on.idem = dup ? 'bad' : 1;
          o.rows.ped = act('pedidos', '2,5 s', ['1058 · 71,70', 'acc'], dup ? ['1059 · 71,70 de novo', 'bad'] : ['', 'dim']);
          o.rows.idem = act('idempotencia', 'TABELA', ['3f9a2c7e-… · concluido', 'acc'], dup ? ['9b1e04d2-… · concluido', 'bad'] : ['', 'dim'], ['cada chave: INSERT 0 1', dup ? 'bad' : 'dim']);
          bm(o, CAB.pi, { on: true, tone: dup ? 'bad' : '' }); pk(o, WAY.toPed, f1, 'chave 3f9a…'); pk(o, WAY.toPed, f2, 'chave 9b1e…', 'bad');
          o.cnt = [['PEDIDOS CRIADOS', dup ? '2' : f1 >= 1 ? '1' : '0', dup ? 'bad' : ''], ['CHAVES', dup ? '2' : '1', dup ? 'bad' : 'dim'], ['O CERTO', '1 chave por compra', 'dim']];
          o.res = dup ? [['dois pedidos de novo', 'bad'], ['a chave nasce no clique', 'acc']] : []; } },
    ],
    retry: [
      { id: 'um', dur: 5, title: 'Um clique, uma chamada', yk: 'A POLÍTICA DA AULA 7', act: ['PSP-A em 8 s', 'as camadas repetem'],
        code: ['até 3 tentativas (1 + 2)', 'só em 503, 504, timeout, conexão recusada', 'só com Idempotency-Key', 'backoff de 100 ms, full jitter, teto 2 s', 'orçamento: 10% das chamadas'],
        story: 'Com o PSP-A respondendo, o clique do Caio vira <b>uma</b> chamada em cada elo e uma ao <code>pagamentos</code>. Repetir resolve falhas passageiras (um pacote perdido, uma réplica reiniciando). O problema é quando cada camada decide repetir por conta própria, sem saber das outras.',
        look: 'Uma luz atravessa a linha de ponta a ponta. Os cabos marcam ×1.',
        key: 'Retry resolve a falha passageira, e é só para ela.',
        f(o, t) { lit(o, 'app', 'pag'); pk(o, WAY.full, (t * 0.3) % 1, '1058');
          ['bff', 'ped', 'pag'].forEach(nm => T(o, [Lf(nm) - 10, CY, 44], '×1', 'dim'));
          o.cnt = [['CHAMADAS AO pagamentos', '1'], ['POR CLIQUE', '1', 'dim'], ['CAPACIDADE', '40/s', 'dim']];
          o.res = [['uma chamada por clique', 'acc']]; } },
      { id: 'cascata', dur: 8, title: 'Três camadas, três tentativas cada: 27', yk: 'A MULTIPLICAÇÃO',
        code: ['gw-loja tenta o bff-app 3 vezes', 'cada uma: bff-app tenta o pedidos 3 vezes', 'cada uma: pedidos tenta o pagamentos 3 vezes', '3 × 3 × 3 = 27 por clique', '3 camadas × 2 tentativas = 8'],
        story: 'Com o PSP-A em 8 s, o <code>pagamentos</code> falha, e cada camada acima repete. O <code>gw-loja</code> tenta o <code>bff-app</code> 3 vezes; cada uma dessas tenta o <code>pedidos</code> 3 vezes; cada uma dessas tenta o <code>pagamentos</code> 3 vezes. São <b>27</b> chamadas ao <code>pagamentos</code> por clique. É o fio solto do módulo 10.',
        look: 'Os cabos ganham ×3, ×9 e ×27 da esquerda para a direita, e as luzes se multiplicam até o pagamentos.',
        key: 'Tentativas de camadas diferentes se multiplicam.',
        f(o, t) { const k = lin(t, 0.4, 5, 0, 3); lit(o, 'app', 'gw', 'bff', 'ped'); o.on.pag = k >= 3 ? 'bad' : 1; pspSlow(o);
          const m = [3, 9, 27], nms = ['bff', 'ped', 'pag'];
          nms.forEach((nm, i) => { if (k > i) { T(o, [Lf(nm) - 10, CY, 44], '×' + m[i], i === 2 ? 'bad' : 'acc'); bm(o, LINKS[nm], { on: true, flow: true, tone: i === 2 ? 'bad' : '' }); } });
          const n = k >= 3 ? 27 : k >= 2 ? 9 : k >= 1 ? 3 : 1;
          o.cnt = [['CHAMADAS AO pagamentos', String(k >= 3 ? 27 : 1), k >= 3 ? 'bad' : ''], ['NO ELO ATUAL', '×' + n, 'dim'], ['O PSP-A', 'em 8 s', 'bad']];
          o.res = k >= 3 ? [['27 chamadas por clique', 'bad']] : [['multiplicando…', 'dim']]; } },
      { id: 'carga', dur: 6, title: '30 pedidos/s × 27 = 810/s contra 40/s', yk: 'A CONTA',
        code: ['30 pedidos/s × 27 = 810/s', 'pagamentos: 2 réplicas × 20/s = 40/s', '810 ÷ 40 = 20,2×', '3 camadas × 2 tentativas: 30 × 8 = 240/s', '1 camada × 3 tentativas: 30 × 3 = 90/s'],
        story: 'A 30 pedidos/s da Black Friday, 27 chamadas por clique dão <b>810/s</b> sobre um <code>pagamentos</code> que aguenta <b>40/s</b> (2 réplicas de 20/s): <b>20,2 vezes</b> a capacidade. O <code>pagamentos</code>, que não tinha defeito nenhum, cai junto com o PSP. Com 2 tentativas por camada seriam 240/s; com uma camada só repetindo 3 vezes, 90/s.',
        look: 'Na frente, as barras: a capacidade de 40/s é um degrau baixo; a de 810/s sobe em vermelho bem acima de todas.',
        key: 'A tempestade de retries derruba quem estava bom.',
        f(o, t) { const f = lin(t, 0.3, 2.5, 0, 1); lit(o, 'app', 'gw', 'bff', 'ped'); o.on.pag = 'bad'; pspSlow(o);
          o.rows.pag = act('pagamentos', '40/s', ['recebe 810/s', 'bad'], ['20,2 × a capacidade', 'bad']);
          bars(o, [['40/s cap.', 40, 810, 'acc'], ['1×3 · 90', 90 * f, 810, 'dim'], ['3×2 · 240', 240 * f, 810, 'dim'], ['3×3 · 810', 810 * f, 810, 'bad']], 300, 140, 60);
          bm(o, CAB.pp, { on: true, flow: true, tone: 'bad' });
          o.cnt = [['CHEGAM AO pagamentos', '810/s', 'bad'], ['CAPACIDADE', '40/s', 'dim'], ['SOBRECARGA', '20,2×', 'bad']];
          o.res = [['o pagamentos cai junto', 'bad']]; } },
      { id: 'uma', dur: 8, title: 'Uma camada só repete, e só se sobrar prazo', yk: 'O PRAZO DO pagamentos (2,0 s)',
        code: ['tentativa 1: 0 → 1,0 s (timeout)', 'espera: 0,1 s (backoff)', 'tentativa 2: recebe 2,0 − 1,0 − 0,1 = 0,9 s', 'tentativa 3: não sobra prazo', 'gw-loja, bff-app e pedidos: ×1'],
        story: 'A primeira defesa é repetir em <b>uma camada só</b>; as outras passam o erro adiante. A segunda é o <b>prazo</b>: só vale tentar de novo se sobrar tempo. O <code>pagamentos</code> tem 2,0 s. A primeira tentativa ao PSP-A gasta 1,0 s, a espera é de 0,1 s, e a segunda recebe só o que sobrou: <b>0,9 s</b>. A terceira não cabe, então não acontece.',
        look: 'Os cabos de cima voltam a ×1. No elo do PSP-A, duas luzes saem uma depois da outra, e a segunda tem o relógio menor.',
        key: 'Uma camada repete, dentro do prazo de quem chamou.',
        f(o, t) { const s = lin(t, 0.4, 6, 0, 2.2); lit(o, 'app', 'gw', 'bff', 'ped', 'pag'); pspSlow(o);
          ['bff', 'ped', 'pag'].forEach(nm => T(o, [Lf(nm) - 10, CY, 44], '×1', 'dim'));
          const a1 = s < 1, a2 = s >= 1.1 && s < 2.0; bm(o, CAB.pa, { on: a1 || a2, tone: 'bad' });
          if (a1) pk(o, WAY.pa, 0.1 + s * 0.8, `1ª · ${thou(s * 1000)} de 1.000 ms`, 'bad');
          if (a2) pk(o, WAY.pa, 0.1 + (s - 1.1) / 0.9 * 0.8, `2ª · ${thou((s - 1.1) * 1000)} de 900 ms`, 'bad');
          o.cnt = [['CHAMADAS AO PSP', s >= 1.1 ? '2' : '1'], ['PRAZO GASTO', `${dec(Math.min(2, s), 1)} de 2,0 s`, 'dim'], ['3ª TENTATIVA', s >= 2 ? 'não cabe' : '…', 'dim']];
          o.res = s >= 2 ? [['2 tentativas, dentro do prazo', 'acc'], ['erro devolvido a tempo', 'dim']] : []; } },
      { id: 'orcamento', dur: 6, title: 'Orçamento de retry: 10% a mais, nunca 27 vezes', yk: 'O ORÇAMENTO',
        code: ['retentativas ≤ 10% das chamadas', '30/s × 1,1 = 33/s ≤ 40/s', 'SRE: 60 retentativas/min por processo', 'orçamento acabou: falha na hora', 'só repete o que é idempotente'],
        story: 'A terceira defesa é um <b>orçamento</b>: no máximo 10% de chamadas a mais. A 30 pedidos/s, o <code>pagamentos</code> recebe no pior caso <b>33/s</b>, abaixo dos 40/s. Quando o orçamento acaba, a falha volta na hora em vez de virar mais uma tentativa. O livro de SRE do Google dá o exemplo de 60 retentativas por minuto por processo. E só se repete o que tem chave de idempotência (aula 5).',
        look: 'A barra de 810/s some; no lugar, uma barra de 33/s abaixo da capacidade de 40/s.',
        key: 'Com orçamento, a retentativa nunca passa de uma fração da carga.',
        f(o, t) { const f = lin(t, 0.3, 2.5, 0, 1); lit(o, 'app', 'gw', 'bff', 'ped', 'pag'); pspSlow(o);
          o.rows.pag = act('pagamentos', '40/s', ['recebe 33/s', 'acc'], ['orçamento 10%', 'dim']);
          bars(o, [['40/s cap.', 40, 810, 'acc'], ['sem freio · 810', 810 * (1 - f), 810, 'dim'], ['10% · 33', 33, 810, 'acc']], 300, 180, 60);
          o.cnt = [['CHEGAM AO pagamentos', '33/s'], ['CAPACIDADE', '40/s', 'dim'], ['RETENTATIVAS', '≤ 10%', 'dim']];
          o.res = [['33/s cabe em 40/s', 'acc']]; } },
      { id: 'metaestavel', dur: 8, title: 'E se der errado: a tempestade segura o incêndio', yk: 'FALHA METAESTÁVEL',
        code: ['20:21:30: o PSP-A volta a 180 ms', 'as retentativas atrasadas seguem chegando', 'pagamentos acima de 40/s', 'cada timeout gera mais retentativas', 'a causa sumiu, a falha ficou'],
        story: 'Sem freio, o pior vem depois. Às <b>20:21:30</b> o PSP-A volta a responder em 180 ms, mas o <code>pagamentos</code> continua afogado: as retentativas atrasadas das três camadas seguem chegando, cada uma que estoura o timeout gera outras, e a fila nunca esvazia. A causa sumiu e a falha ficou. Esse estado tem nome, falha <b>metaestável</b> (Bronson et al., HotOS 2021), e só sai dele quem corta a carga.',
        look: 'O PSP-A volta ao normal. O pagamentos continua vermelho, com os cabos de cima ainda cheios de luz.',
        key: 'Retry sem freio mantém o sistema caído depois que a causa passou.',
        f(o, t) { const back = t > 1.5; lit(o, 'app', 'gw', 'bff', 'ped'); o.on.pag = 'bad';
          if (back) { o.on.pspa = 1; o.rows.pspa = act('PSP-A', '1 s', ['voltou: 180 ms', 'acc'], ['20:21:30', 'dim']); } else pspSlow(o);
          o.rows.pag = act('pagamentos', '40/s', ['ainda afogado', 'bad'], ['retentativas atrasadas', 'bad']);
          ['gw', 'bff', 'ped', 'pag'].forEach(nm => bm(o, LINKS[nm], { on: true, flow: true, tone: 'bad' }));
          o.cnt = [['PSP-A', back ? '180 ms de novo' : 'em 8 s', back ? '' : 'bad'], ['pagamentos', 'sobrecarregado', 'bad'], ['QUEM SEGURA', 'as retentativas', 'bad']];
          o.res = back ? [['a causa sumiu, a falha ficou', 'bad']] : [];
          if (back) T(o, [Cx('pag'), CY, 50], 'ainda caído', 'bad'); } },
    ],
    jitter: [
      { id: 'cena', dur: 5, title: '1.000 clientes chamam ao mesmo tempo', yk: 'A SIMULAÇÃO', act: ['Intervalo fixo', '100 ms'],
        code: ['1.000 clientes chamam em t = 0', 'o PSP fica fora até 2,0 s', 'depois atende 200/s e recusa o resto', 'cada cliente tenta até 10 s', 'base 100 ms · teto 5 s · semente 7'],
        story: 'Para ver o que a <b>espera</b> entre tentativas muda, a simulação põe 1.000 clientes chamando o PSP no mesmo instante. O PSP fica fora até <b>2,0 s</b>; depois atende <b>200/s</b> (20 a cada 100 ms) e recusa o resto. Cada cliente tenta até um prazo de 10 s. Cada coluna na frente é uma janela de 100 ms; a altura é quantas chamadas chegaram nela.',
        look: 'Na frente, a primeira coluna sobe até 1.000: todo mundo chamou junto, com o PSP fora.',
        key: 'O que importa é quando cada cliente volta a tentar.',
        f(o, t) { lit(o, 'app'); o.on.pspa = 'bad'; jcols(o, 'fixo', 0);
          o.cnt = [['CLIENTES', '1.000'], ['PSP FORA ATÉ', '2,0 s', 'dim'], ['DEPOIS ATENDE', '200/s', 'dim']]; o.res = [['5 estratégias, mesma carga', 'acc']]; } },
      jstep('fixo', 'Intervalo fixo de 100 ms', 'Full jitter', ['espera = 100 ms, sempre', '45.500 chamadas · 45,5 por cliente', 'pico depois de voltar: 1.000', 'recusadas com o PSP de pé: 24.500', 'todos concluem; o último em 6,9 s'],
        'Cada cliente espera <b>100 ms</b> e tenta de novo, sempre. Durante os 2 s de falha são 1.000 chamadas a cada 100 ms. Quando o PSP volta, ainda chegam 1.000 por janela para 20 vagas. Todos acabam conseguindo, o último em 6,9 s, mas com <b>45.500</b> chamadas: 45,5 por cliente, e <b>24.500</b> recusadas com o PSP já de pé.',
        'Uma parede de colunas de 1.000 até os 2 s, e depois uma rampa que desce devagar até os 7 s.', 'Intervalo fixo martela o PSP justo quando ele volta.'),
      jstep('full', 'Exponencial + full jitter', 'Equal jitter', ['espera = sorteio(0, min(5 s, 100 ms × 2ⁿ))', '7.540 chamadas', 'pico depois de voltar: 84', 'recusadas com o PSP de pé: 687', '1.000 concluem em 10 s'],
        'A espera dobra a cada tentativa (100, 200, 400 ms…) e é <b>sorteada</b> entre zero e esse valor. Os clientes se espalham no tempo: depois dos 2 s o pico é de <b>84</b> chamadas por janela, e só <b>687</b> são recusadas com o PSP de pé. Os 1.000 concluem dentro dos 10 s, com <b>7.540</b> chamadas no total.',
        'As colunas baixam rápido e viram um tapete baixo e espalhado depois dos 2 s.', 'O sorteio espalha as tentativas e o pico cai de 1.000 para 84.'),
      jstep('equal', 'Exponencial + equal jitter', 'Decorrelated', ['e = min(5 s, 100 ms × 2ⁿ)', 'espera = e/2 + sorteio(0, e/2)', '7.162 chamadas · pico 130', 'recusadas com o PSP de pé: 1.085', '993 concluem'],
        'O <i>equal jitter</i> garante metade da espera e sorteia só a outra metade. Espalha menos que o <i>full</i>: pico de <b>130</b> depois dos 2 s, <b>1.085</b> recusadas com o PSP de pé, <b>993</b> de 1.000 concluídos no prazo, com 7.162 chamadas. A ordem entre <i>equal</i> e <i>full</i> é deste cenário; o que vale sempre é que os dois vencem o sem jitter.',
        'Ainda se veem ondas fracas nas colunas, mais baixas que no intervalo fixo e mais altas que no full.', 'Meia espera fixa deixa um resto de sincronia.'),
      jstep('decorr', 'Decorrelated jitter', 'Sem jitter', ['espera = min(5 s, sorteio(100 ms, 3 × anterior))', '7.590 chamadas · pico 125', 'recusadas com o PSP de pé: 1.397', '999 concluem', 'a espera depende da anterior'],
        'O <i>decorrelated</i> sorteia a próxima espera entre 100 ms e o triplo da anterior, com teto de 5 s. Fica perto dos outros com jitter: pico de <b>125</b>, <b>1.397</b> recusadas com o PSP de pé e <b>999</b> concluídos, com 7.590 chamadas.',
        'As colunas descem logo depois da primeira e ficam baixas até o fim.', 'Qualquer jitter espalha; o que muda entre eles é pouco.'),
      jstep('exp', 'E se der errado: exponencial sem jitter', null, ['espera = 100, 200, 400, 800, 1.600 ms…', 'todos esperam o mesmo: ondas de 1.000', '6.980 chamadas · pico 1.000', 'recusadas com o PSP de pé: 1.940', 'só 40 concluem no prazo (4%)'],
        'O <i>backoff</i> exponencial sem sorteio parece prudente: cada cliente espera 100, 200, 400, 800, 1.600 ms. Só que <b>todos</b> esperam o mesmo, e voltam juntos. Cada onda traz 1.000 chamadas para 20 vagas, e o resto espera ainda mais. Faz menos chamadas que o intervalo fixo (6.980), mas só <b>40</b> clientes, <b>4%</b>, concluem dentro dos 10 s. A AWS chama essa estratégia de "o claro perdedor".',
        'Colunas isoladas de 1.000, cada vez mais separadas, com o vão vazio entre elas.', 'Backoff sem jitter vira ondas sincronizadas: o pico continua 1.000.'),
    ],
    breaker: [
      { id: 'cena', dur: 5, title: 'O disjuntor no elo pagamentos → PSP-A', yk: 'A CONFIGURAÇÃO', act: ['PSP-A em 8 s', '20:20:00'],
        code: ['janela de 20 chamadas, mínimo 10', 'abre com ≥ 50% de falhas', 'lenta (> 1 s) conta como falha', 'aberto por 30 s', 'meio-aberto: 5 sondas'],
        story: 'Entre o <code>pagamentos</code> e o PSP-A há um <b>disjuntor</b>. Fechado, ele deixa passar e conta o resultado das últimas <b>20</b> chamadas; com pelo menos 10 contadas e <b>50%</b> de falhas, ele abre. Chamada mais lenta que 1 s conta como falha. Aberto, nada passa por <b>30 s</b>; depois, no meio-aberto, <b>5 sondas</b> decidem se fecha.',
        look: 'O interruptor entre o pagamentos e o PSP-A está fechado, aceso, e as chamadas passam por ele.',
        key: 'O disjuntor conta falhas e para de chamar quem está falhando.',
        f(o, t) { lit(o, 'app', 'pag', 'pspa'); o.pool.n = 5; o.sw = 'closed'; pk(o, WAY.pa, (t * 0.5) % 1, '180 ms');
          bm(o, CAB.pa1, { on: true }); bm(o, CAB.pa2, { on: true });
          o.cnt = [['ESTADO', 'fechado'], ['JANELA', '20 · mínimo 10', 'dim'], ['ABRE COM', '≥ 50% de falhas', 'dim']]; o.res = [['tudo passa e é contado', 'acc']];
          T(o, [732, CY, 50], 'disjuntor', 'acc'); } },
      bstep('abre', 'Abre em 1,3 s', 0, 2.6, 'POR QUE 1,3 s', ['as 10 primeiras saem entre 0 e 0,3 s', 'nenhuma volta antes de 1 s', 'falham por timeout entre 1,0 e 1,3 s', '10 de 10 falharam: abre', '20:20:01,3'],
        'Às 20:20:00 o PSP-A passa a responder em 8 s. As 10 primeiras chamadas saem entre 0 e 0,3 s e estouram o timeout de 1 s entre <b>1,0 e 1,3 s</b>. Com o mínimo de 10 atingido e 100% de falhas, o disjuntor <b>abre em 1,3 s</b>. O pool, que chegou a 30 conexões, esvazia.',
        'O interruptor levanta e fica vermelho. As colunas da frente, uma por segundo, param de subir.', 'Com timeout de 1 s, o disjuntor abre 1,3 s depois do início da falha.'),
      bstep('aberto', 'Aberto: 30 s de falha rápida', 1.3, 31.2, 'FALHA RÁPIDA',
        ['nada passa por 30 s', 'resposta na hora: falha rápida', 'o pool fica vazio', 'o PSP-A não recebe nada', 'é aqui que o fallback entra (aula 9)'],
        'Aberto, o disjuntor responde na hora, sem chamar o PSP-A: é a <b>falha rápida</b>. O pool fica vazio, o <code>pagamentos</code> não espera nada e o PSP-A, que já estava mal, não recebe mais carga. O pagamento ainda falha, mas falha em microssegundos, e o <code>pagamentos</code> fica livre para tentar o PSP-B (aula 9).',
        'O interruptor fica levantado. Na frente, as colunas viram plaquinhas baixas: são as falhas rápidas.', 'Aberto, o disjuntor falha na hora e poupa os dois lados.'),
      bstep('sondas', 'Meio-aberto: as sondas falham e ele reabre', 31, 64.5, 'AS SONDAS',
        ['31,3 s: meio-aberto, 5 sondas', 'as sondas estouram 1 s: reabre em 32,43 s', '62,47 s: meio-aberto de novo', '63,6 s: reabre', 'cada teste custa só 5 chamadas'],
        'Depois de 30 s o disjuntor fica <b>meio-aberto</b> em 31,3 s e deixa passar 5 sondas. O PSP-A ainda está em 8 s, as sondas estouram o timeout e ele <b>reabre</b> em 32,43 s. Em 62,47 s tenta de novo e reabre em 63,6 s. Cada teste custa 5 chamadas, não 900.',
        'O interruptor desce até a metade, piscando, e volta a levantar. Duas colunas pequenas aparecem em 31 s e 62 s.', 'O meio-aberto testa a dependência com poucas chamadas.'),
      bstep('fecha', 'O PSP-A volta e o disjuntor fecha em 93,91 s', 88, 100, '237 × 3.000',
        ['90 s (20:21:30): o PSP-A volta a 180 ms', '93,6 s: meio-aberto, 5 sondas', 'as sondas passam: fecha em 93,91 s', 'em 100 s: 237 chamadas ao PSP-A', 'sem breaker: 3.000 (2.700 inúteis)'],
        'O PSP-A volta às <b>20:21:30</b> (90 s). O disjuntor só descobre no próximo meio-aberto, em <b>93,6 s</b>; as sondas passam e ele <b>fecha em 93,91 s</b>. Em 100 s, o PSP-A recebeu <b>237</b> chamadas (54 durante a falha) contra <b>3.000</b> sem disjuntor, 2.700 delas inúteis. As outras <b>2.763</b> foram falhas rápidas.',
        'O interruptor desce e acende. As colunas voltam a subir até 30 por segundo depois dos 94 s.', '237 chamadas em vez de 3.000: o PSP-A se recupera sem carga em cima.'),
      { id: 'so-erro', dur: 7, title: 'E se der errado: o disjuntor que só conta erro', yk: 'LENTO TAMBÉM É FALHA',
        code: ['o PSP responde 200, mas em 8 s', 'sem "lenta = falha", nada conta como erro', 'o disjuntor nunca abre', 'o pool esgota em 1,67 s', 'o checkout para com o disjuntor fechado'],
        story: 'Um disjuntor que só conta <b>erro</b> não vê o PSP-A lento: as respostas chegam em 8 s com status 200, "sucesso". Ele fica fechado o tempo todo e o pool esgota em <b>1,67 s</b>, como se não houvesse disjuntor. Por isso a configuração da loja conta chamada acima de 1 s como falha. O outro jeito de errar é o timeout longo: com 2 s, o disjuntor só abre em <b>2,3 s</b> e <b>11</b> chamadas ainda são recusadas pelo pool.',
        look: 'O interruptor continua fechado e aceso enquanto os 50 encaixes do pool ficam vermelhos.',
        key: 'Lentidão tem de contar como falha, senão o disjuntor nunca abre.',
        f(o, t) { const s = lin(t, 0.4, 5, 0, 3), n = Math.min(50, 30 * s), full = s >= 50 / 30; lit(o, 'app'); o.sw = 'closed';
          o.on.pspa = 'bad'; o.rows.pspa = act('PSP-A', '200 OK', ['responde em 8 s', 'bad'], ['"sucesso"', 'dim']); o.pool.n = n; o.pool.bad = full; o.on.pag = full ? 'bad' : 1;
          bm(o, CAB.pa1, { on: true, tone: 'bad' }); bm(o, CAB.pa2, { on: true, tone: 'bad' }); pk(o, WAY.pa, 0.1 + (s % 1) * 0.8, `${thou(s * 1000)} ms`, 'bad');
          o.cnt = [['ESTADO', 'fechado, sempre', 'bad'], ['POOL', `${Math.floor(n)} de 50`, full ? 'bad' : ''], ['O PSP RESPONDE', '200 em 8 s', 'dim']];
          o.res = full ? [['pool esgotado com o disjuntor fechado', 'bad'], ['lenta > 1 s = falha', 'acc']] : [];
          if (full) T(o, [623, 300, 24], 'pool cheio', 'bad'); } },
    ],
    fallback: [
      { id: 'cena', dur: 5, title: 'O pagamentos tem dois PSPs', yk: 'UM DISJUNTOR POR PSP', act: ['Abrir o breaker', 'PSP-A em 8 s'],
        code: ['PSP-A: p50 180 ms · recebe 30/s', 'PSP-B: p50 300 ms · reserva', 'cada um com o seu disjuntor', 'o estado do disjuntor do A', 'decide quando usar o B'],
        story: 'Desde o módulo 12 a loja tem um segundo PSP contratado. O PSP-A responde em 180 ms e recebe todo o tráfego; o <b>PSP-B</b> responde em <b>300 ms</b> e fica de reserva. Cada um tem o seu disjuntor. O <b>fallback</b> é o caminho alternativo para o mesmo objetivo (cobrar o cartão), pagando um preço: aqui, 120 ms a mais.',
        look: 'O PSP-B fica na frente do PSP-A, com um cabo próprio saindo do pagamentos. Por enquanto, só o cabo do A tem luz.',
        key: 'Fallback é outro caminho para o mesmo resultado, com algum custo.',
        f(o, t) { lit(o, 'app', 'pag', 'pspa'); o.pool.n = 5; pk(o, WAY.pa, (t * 0.5) % 1, '180 ms'); bm(o, CAB.pa1, { on: true }); bm(o, CAB.pa2, { on: true });
          o.cnt = [['PSP-A', '30/s'], ['PSP-B', '0/s', 'dim'], ['DISJUNTORES', 'um por PSP', 'dim']]; o.res = [['o B espera', 'dim']]; } },
      { id: 'desvia', dur: 7, title: 'Breaker aberto: o 1058 vai para o PSP-B', yk: 'O FALLBACK REATIVO',
        code: ['20:20:01,3: o disjuntor do A abre', '20:20:04: chega o 1058', 'pagamentos → PSP-B', '59,70 + 12,00 = 71,70', 'aprovado em ~300 ms'],
        story: 'Às <b>20:20:01,3</b> o disjuntor do PSP-A abriu. Às <b>20:20:04</b> chega o pedido <b>1058</b> do Caio: 3 canecas azuis (59,70) e o frete do Rio (12,00), <b>71,70</b>. Com o A aberto, o <code>pagamentos</code> manda a cobrança ao <b>PSP-B</b>, que aprova em uns 300 ms. O Caio paga e nem fica sabendo do incidente.',
        look: 'O interruptor do PSP-A está levantado e vermelho. A luz do 1058 desce pelo cabo da frente até o PSP-B, que acende.',
        key: 'Com o disjuntor aberto, o fallback mantém a venda.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 2.3, 3.8, 0, 1), ok = f2 >= 1; lit(o, 'app', 'gw', 'bff', 'ped', 'pag'); pspSlow(o); o.sw = 'open';
          if (ok) { lit(o, 'pspb'); o.rows.pspb = act('PSP-B', 'p50 300 ms', ['1058 · 71,70', 'acc'], ['aprovado', 'acc']); }
          bm(o, CAB.pb, { on: f2 > 0 && !ok }); pk(o, WAY.toPag, f1, '1058 · 71,70'); pk(o, WAY.pb, f2, '1058');
          o.cnt = [['O 1058', ok ? 'aprovado no B' : '…', ok ? '' : 'dim'], ['RELÓGIO', clock(4 + 0.3 * f2, 1)], ['PSP-A', 'disjuntor aberto', 'bad']];
          o.res = ok ? [['o Caio pagou', 'acc'], ['~120 ms mais lento', 'dim']] : []; } },
      { id: 'frete', dur: 6, title: 'O frete de tabela: outro fallback no mesmo pedido', yk: 'VALOR DE RESERVA', act: ['1% proativo', '0,3/s ao PSP-B'],
        code: ['cotação da transportadora: falhou', 'vale o frete de tabela', 'Recife 15,00 · SP 9,00 · Rio 12,00', 'parceiro B: R$ 0,10 × A: R$ 0,03', '10 min a 30/s: +R$ 1.260'],
        story: 'O mesmo pedido tem outro fallback. Se a cotação da transportadora falha, o <code>pedidos</code> usa o <b>frete de tabela</b>: Recife 15,00, SP 9,00, <b>Rio 12,00</b>. É um valor de reserva, menos preciso que a cotação ao vivo. Outra opção seria um segundo parceiro de cotação, mais caro: R$ 0,10 contra R$ 0,03 por consulta, <b>+R$ 1.260</b> em 10 minutos a 30/s.',
        look: 'O pedidos mostra a cotação em vermelho e a tabela do Rio acesa logo abaixo.',
        key: 'Um valor de reserva troca precisão por continuar vendendo.',
        f(o, t) { const ok = t > 1.4; lit(o, 'app', 'pspb'); o.on.ped = 1; o.sw = 'open'; pspSlow(o);
          o.rows.ped = act('pedidos', '2,5 s', ['cotação: falhou', 'bad'], [ok ? 'tabela Rio: 12,00' : '…', ok ? 'acc' : 'dim'], ['1058 = 71,70', 'hi']);
          o.rows.pspb = act('PSP-B', 'p50 300 ms', ['1058 · 71,70', 'acc'], ['aprovado', 'acc']);
          o.cnt = [['FRETE DO 1058', ok ? '12,00 (tabela)' : '…'], ['RECIFE · SP', '15,00 · 9,00', 'dim'], ['COTAÇÃO', 'falhou', 'bad']];
          o.res = ok ? [['o pedido fecha com a tabela', 'acc']] : []; if (ok) T(o, [Cx('ped'), CY, 50], 'frete de tabela', 'acc'); } },
      { id: 'proativo', dur: 7, title: '1% proativo: o PSP-B sempre em uso', yk: 'O FALLBACK PROATIVO',
        code: ['30/s × 1% = 0,3/s ao PSP-B', '0,3 × 60 = 18 cobranças por minuto', 'o PSP-B cobra de verdade, todo dia', 'um defeito aparece numa terça', 'não às 20:20 da Black Friday'],
        story: 'Um fallback que só roda no incidente é código que ninguém testou. O fallback <b>proativo</b> manda <b>1%</b> do tráfego ao PSP-B o tempo todo: 30 × 1% = <b>0,3/s</b>, <b>18 por minuto</b>. Se o B tiver um defeito, ele aparece numa terça qualquer, com 1% do tráfego. A AWS diz que prefere "caminhos de código exercitados continuamente".',
        look: 'Com o disjuntor fechado, quase toda a luz vai ao PSP-A, e um fio fino de pontos segue sempre para o PSP-B.',
        key: 'O fallback que roda todo dia é o fallback que funciona no dia ruim.',
        f(o, t) { lit(o, 'app', 'pag', 'pspa', 'pspb'); o.pool.n = 5; o.sw = 'closed';
          o.rows.pspa = act('PSP-A', '1 s', ['29,7/s', 'acc']); o.rows.pspb = act('PSP-B', '1%', ['0,3/s', 'acc'], ['18 por minuto', 'hi']);
          bm(o, CAB.pa1, { on: true, flow: true }); bm(o, CAB.pa2, { on: true, flow: true }); bm(o, CAB.pb, { on: true }); pk(o, WAY.pb, (t * 0.25) % 1, '1%');
          o.cnt = [['AO PSP-B', '0,3/s'], ['POR MINUTO', '18', 'dim'], ['AO PSP-A', '29,7/s', 'dim']]; o.res = [['o B é testado todo dia', 'acc']]; } },
      { id: 'credencial', dur: 7, title: 'E se der errado: o PSP-B com credencial vencida', yk: 'O FALLBACK QUE NINGUÉM TESTOU',
        code: ['sem o 1% proativo', 'o PSP-B não recebe nada há meses', '20:20:01,3: o disjuntor do A abre', '100% do tráfego vai ao PSP-B', 'credencial vencida: tudo recusado'],
        story: 'Sem o tráfego proativo, o PSP-B passou meses sem receber nada. Às 20:20:01,3 o disjuntor do A abre e <b>100%</b> do tráfego vai para o B, que recusa tudo: a <b>credencial venceu</b> e ninguém viu. O 1058 do Caio falha nos dois PSPs. Há outro jeito de o fallback piorar a falha: o B tem capacidade menor e cai com o tráfego inteiro do A. Por isso o fallback também precisa de disjuntor e de limite.',
        look: 'O interruptor do A levanta, a luz desce para o PSP-B e o B fica vermelho.',
        key: 'Fallback que nunca roda falha justo quando é chamado.',
        f(o, t) { const f2 = lin(t, 0.8, 2.6, 0, 1), bad = f2 >= 1; lit(o, 'app', 'pag'); pspSlow(o); o.sw = 'open';
          if (bad) { o.on.pspb = 'bad'; o.on.app = 'bad'; o.rows.pspb = act('PSP-B', '100%', ['credencial vencida', 'bad'], ['recusa tudo', 'bad']); o.rows.app = act('app', '5 s', ['Caio: falhou', 'bad']); }
          bm(o, CAB.pb, { on: true, tone: bad ? 'bad' : '' }); pk(o, WAY.pb, f2, '1058');
          o.cnt = [['PSP-B', bad ? 'credencial vencida' : '…', bad ? 'bad' : 'dim'], ['TRÁFEGO NO PSP-B', '100%', 'bad'], ['O 1058', bad ? 'recusado' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['os dois caminhos falharam', 'bad'], ['o 1% teria avisado antes', 'acc']] : []; } },
    ],
    degradacao: [
      { id: 'cena', dur: 5, title: 'O catálogo: 10 réplicas, 1.000 req/s', yk: 'A CAPACIDADE', act: ['Rajada de 1.300', '20:20, a newsletter'],
        code: ['10 ms de CPU por página', '= 100 req/s por réplica', '10 réplicas = 1.000 req/s', 'pico medido (módulo 14): 640', 'projetado: 950'],
        story: 'O catálogo monta a vitrine. Cada página gasta <b>10 ms</b> de CPU, então cada réplica atende <b>100 req/s</b> e as 10 réplicas, <b>1.000</b>. O módulo 14 mediu pico de 640 req/s e projetou 950. Na frente, a barra vermelha é a demanda; as outras são a capacidade em cada nível de degradação.',
        look: 'A barra da demanda (640) fica abaixo da do nível 0 (1.000). Os níveis 1, 2 e 3 esperam apagados.',
        key: 'Capacidade = réplicas × páginas por segundo de cada uma.',
        f(o, t) { lit(o, 'app', 'gw', 'bff', 'cat'); dbars(o, 640, 0); pk(o, WAY.cat, (t * 0.35) % 1, '');
          o.cnt = [['CAPACIDADE', '1.000 req/s'], ['DEMANDA', '640 req/s', 'dim'], ['POR RÉPLICA', '100 req/s', 'dim']]; o.res = [['folga de 360 req/s', 'acc']]; } },
      { id: 'rajada', dur: 6, title: '20:20: uma rajada de 1.300 req/s', yk: 'A RAJADA', act: ['Nível 1', 'sem recomendações'],
        code: ['newsletter: 1.300 req/s', 'dura poucos segundos', 'capacidade: 1.000 → faltam 300', 'HPA: 10 → 14 réplicas = 1.400', 'mas leva minutos'],
        story: 'Às 20:20 a newsletter sai e a demanda dá uma <b>rajada de 1.300 req/s</b>, por poucos segundos. Faltam 300. O autoscaling (HPA, de 10 para 14 réplicas, 1.400 req/s) resolveria, mas leva minutos, e a rajada acaba antes. Sem fazer nada, as filas crescem e a vitrine fica lenta para todo mundo, inclusive para quem está indo pagar.',
        look: 'A barra vermelha passa da barra do nível 0. O catálogo fica vermelho.',
        key: 'Uma rajada de segundos não espera o autoscaling.',
        f(o, t) { const d = lin(t, 0.3, 2.3, 640, 1300); lit(o, 'app', 'gw', 'bff'); o.on.cat = d > 1000 ? 'bad' : 1; dbars(o, d, 0); pk(o, WAY.cat, (t * 0.5) % 1, '', d > 1000 ? 'bad' : '');
          o.cnt = [['DEMANDA', `${thou(d)} req/s`, d > 1000 ? 'bad' : ''], ['CAPACIDADE', '1.000', 'dim'], ['FALTAM', `${thou(Math.max(0, d - 1000))} req/s`, d > 1000 ? 'bad' : 'dim']];
          o.res = d > 1000 ? [['a vitrine fica lenta para todos', 'bad']] : []; } },
      dstep(1, 'Nível 1: sem recomendações, 1.333 req/s', 'Nível 2', ['desliga as recomendações', '10 ms → 7,5 ms por página', '133 req/s por réplica', '× 10 = 1.333 ≥ 1.300', 'o nível mínimo que segura'],
        'Degradar é <b>desligar de propósito</b> o que não é essencial. No nível 1 a vitrine sai <b>sem recomendações</b>: a página custa 7,5 ms, cada réplica atende 133 req/s e as 10 dão <b>1.333</b>. Já cobre os 1.300. É o nível mínimo que segura a rajada.',
        'A barra do nível 1 acende e passa um pouco da barra vermelha. No catálogo, a linha das recomendações apaga.', 'Desligar o que não é essencial libera capacidade para o essencial.'),
      dstep(2, 'Nível 2: busca simplificada e sem avaliações, 1.667', 'Nível 3', ['+ busca simplificada', '+ sem avaliações', '6 ms por página', '167 req/s × 10 = 1.667', 'mais folga, menos loja'],
        'O nível 2 desliga mais: busca simplificada e sem avaliações. A página cai para 6 ms, 167 req/s por réplica, <b>1.667</b> no total. Sobra folga, mas a loja fica mais pobre. Para 1.300 o nível 1 já bastava; o 2 é para rajadas maiores.',
        'A barra do nível 2 sobe bem acima da demanda. No catálogo, busca e avaliações mudam de estado.', 'Cada nível compra capacidade com funcionalidade.'),
      dstep(3, 'Nível 3: só a página estática da CDN', 'Degradar tarde', ['só a página estática da CDN', 'a vitrine sai da CDN (módulo 5)', 'o catálogo quase não recebe nada', 'sem busca, sem recomendações', 'o último degrau antes de cair'],
        'No nível 3 a vitrine é uma <b>página estática na CDN</b> (módulo 5). O catálogo sai do caminho e a CDN segura qualquer rajada. A loja fica parecida com um folheto: sem busca, sem recomendações, sem avaliações. Prioridade do SRE: checkout primeiro, depois catálogo, depois recomendações.',
        'A luz passa a ir do app para a CDN. O catálogo apaga, e a barra do nível 3 sobe até o alto.', 'O último degrau entrega uma vitrine estática em vez de nenhuma.'),
      { id: 'tarde', dur: 7, title: 'E se der errado: degradar tarde', yk: 'TARDE DEMAIS',
        code: ['as réplicas já estão saturadas', 'a toggle é lida do serviço que caiu', 'a mudança não chega', 'degradar é antes de cair', 'gatilho: sinal de saturação (módulo 14)'],
        story: 'Degradar só funciona <b>antes</b> de cair. Se alguém liga o nível 1 com as réplicas já saturadas, o pedido de mudança entra na mesma fila de tudo, e a configuração é lida do serviço que caiu: a mudança não chega. O gatilho tem de vir de um sinal de saturação (módulo 14), com <b>histerese</b> e um dono para voltar ao nível 0 depois da rajada.',
        look: 'O catálogo está vermelho e a barra do nível 1 fica apagada: foi pedida, mas não aplicada.',
        key: 'Com o serviço saturado, não há mais o que desligar.',
        f(o, t) { lit(o, 'app', 'gw', 'bff'); o.on.cat = 'bad'; dbars(o, 1300, 0);
          o.rows.cat = act('catálogo', 'SATURADO', ['1.300 req/s em 1.000', 'bad'], ['nível pedido: 1', 'hi'], ['nível aplicado: 0', 'bad'], ['toggle não chega', 'bad']);
          pk(o, WAY.cat, (t * 0.5) % 1, '', 'bad');
          o.cnt = [['DEMANDA', '1.300', 'bad'], ['NÍVEL PEDIDO', '1', 'dim'], ['NÍVEL APLICADO', 'nenhum', 'bad']];
          o.res = [['saturado, não muda mais nada', 'bad'], ['degradar antes de cair', 'acc']]; } },
    ],
    backpressure: [
      { id: 'cena', dur: 5, title: '120 eventos/s chegando, 100/s saindo', yk: 'O DÉFICIT', act: ['Fila de 5.000', 'limitada'],
        code: ['chegam 120 eventos/s', 'o projetor processa 100/s', 'sobram 20/s na fila', 'fila limitada: 5.000', '5.000 ÷ 20 = 250 s para encher'],
        story: 'O projetor <code>meus-pedidos</code> do módulo 18 lê os eventos de pedidos e monta a lista de cada cliente. Ele processa <b>100 eventos/s</b>. Na Black Friday chegam <b>120/s</b>: sobram <b>20/s</b> que ficam esperando na fila. <b>Backpressure</b> é o consumidor avisar o produtor para desacelerar.',
        look: 'A fila no meio começa vazia. Entram mais pontos pela esquerda do que saem pela direita.',
        key: 'Chegando mais do que sai, a fila cresce 20 por segundo.',
        f(o, t) { lit(o, 'prod', 'proj'); o.on.fila = 1; pk(o, WAY.pf, (t * 0.35) % 1, '120/s'); pk(o, WAY.pf, (t * 0.35 + 0.5) % 1, '');
          o.cnt = [['DÉFICIT', '20/s'], ['CHEGAM', '120/s', 'dim'], ['SAEM', '100/s', 'dim']]; o.res = [['a fila vai crescer', 'acc']]; } },
      { id: 'limitada', dur: 8, title: 'Fila limitada de 5.000: cheia em 250 s', yk: 'A FILA LIMITADA', act: ['Bloquear', 'o produtor espera'],
        code: ['5.000 ÷ 20/s = 250 s (4 min 10 s)', 'cheia: precisa recusar', 'o produtor fica sabendo', 'atraso máximo: 5.000 ÷ 100 = 50 s', 'drenar: 5.000 ÷ 80 = 62,5 s'],
        story: 'Com limite de <b>5.000</b>, a fila enche em 5.000 ÷ 20 = <b>250 s</b> (4 min 10 s). Cheia, ela não aceita mais, e o produtor <b>fica sabendo</b>: é esse o sinal. O atraso nunca passa de 50 s (5.000 ÷ 100), e quando a chegada cai para 20/s a fila escoa a 80/s e drena em <b>62,5 s</b>. A seguir, três jeitos de responder ao produtor.',
        look: 'A barra da fila enche até a marca de 5.000. As colunas da frente sobem no tempo e param no teto.',
        key: 'Fila limitada transforma sobrecarga em sinal.',
        f(o, t) { const s = lin(t, 0.4, 6, 0, 300), q = Math.min(5000, 20 * s), full = q >= 5000; lit(o, 'prod', 'proj'); o.on.fila = full ? 'bad' : 1;
          fila(o, q, full ? 'cheia: recusa' : 'enchendo'); qcols(o, s, x => Math.min(5000, 20 * x)); pk(o, WAY.pf, (t * 0.35) % 1, '');
          o.cnt = [['NA FILA', thou(q), full ? 'bad' : ''], ['TEMPO', minsec(s)], ['CHEIA EM', '250 s', 'dim']];
          o.res = full ? [['cheia: o produtor precisa saber', 'bad']] : [['enchendo a 20/s', 'dim']]; } },
      pstep('bloquear', 'Bloquear: o produtor espera', '429', 'BLOQUEAR', ['fila cheia: o envio espera', 'pausa do consumidor', 'request(n): só pede o que aguenta', 'janela do TCP faz o mesmo', 'o produtor anda a 100/s'],
        'O jeito mais simples é <b>bloquear</b>: com a fila cheia, o envio espera até abrir vaga. O produtor passa a andar no ritmo do consumidor, 100/s. Os <i>streams</i> reativos fazem isso com <code>request(n)</code> (o consumidor só pede o que aguenta) e o TCP com a janela de recepção.',
        'A fila fica no teto e o Kafka mostra "espera". Os pontos entram no mesmo ritmo em que saem.', 'Bloquear faz o produtor andar no passo do consumidor.', 'espera: 100/s'),
      pstep('429', '429 com Retry-After', 'Descartar', '429 TOO MANY REQUESTS', ['HTTP/1.1 429 Too Many Requests', 'Retry-After: <segundos>', 'RFC 6585 · RFC 9110', 'o produtor sabe que é para esperar', 'e por quanto tempo'],
        'Numa API, o sinal é o status <b><code>429</code></b> (RFC 6585) com o cabeçalho <b><code>Retry-After</code></b> (RFC 9110): "muitas requisições, volte daqui a tantos segundos". O produtor sabe que é para esperar e por quanto tempo, em vez de repetir na hora e virar a tempestade da aula 7.',
        'A fila fica no teto; o que chega a mais volta para a esquerda com 429.', 'O 429 diz "mais devagar" e diz quando voltar.', 'recebe 429'),
      pstep('descartar', 'Descartar por prioridade', 'Fila ilimitada', 'LOAD SHEDDING', ['CRITICAL_PLUS · CRITICAL', 'SHEDDABLE_PLUS · SHEDDABLE', 'sob sobrecarga, recusa cedo', 'primeiro o SHEDDABLE (marketing)', 'o pedido pago passa'],
        'Quando não dá para esperar, <b>descarta-se por prioridade</b> (<i>load shedding</i>). O SRE do Google usa quatro níveis: <code>CRITICAL_PLUS</code>, <code>CRITICAL</code>, <code>SHEDDABLE_PLUS</code>, <code>SHEDDABLE</code>. Sob sobrecarga, a loja recusa cedo o que é <code>SHEDDABLE</code> (os eventos de marketing) e deixa passar o que mexe com pedido pago. Melhor recusar um pouco cedo do que atrasar tudo.',
        'Na entrada da fila, os pontos vermelhos (marketing) são recusados; os acesos (pedidos) entram.', 'Recusar cedo o que pode esperar protege o que não pode.', 'marketing recusado'),
      { id: 'ilimitada', dur: 9, title: 'E se der errado: a fila ilimitada', yk: 'A FILA QUE ESCONDE',
        code: ['sem limite, nada recusa', '10 min: 12.000 eventos', 'atraso: 12.000 ÷ 100 = 120 s, crescendo', 'a memória enche; o processo cai com a fila', 'depois: 12.000 ÷ 80 = 150 s para drenar'],
        story: 'O artigo chama "enfileirar em memória" de backpressure. Não é: sem limite, nada recusa e ninguém fica sabendo. Em 10 minutos são <b>12.000</b> eventos na fila e <b>120 s</b> de atraso, crescendo. A Lena vê o pedido dela 2 minutos depois; a memória enche e o processo pode cair com a fila dentro. Quando a chegada volta a 20/s, ainda leva <b>150 s</b> para drenar.',
        look: 'As colunas sobem sem teto até 12.000 e só descem depois, devagar. A fila fica vermelha.',
        key: 'Fila sem limite esconde a sobrecarga até ela derrubar o processo.',
        f(o, t) { const s = lin(t, 0.4, 7.4, 0, 750), q = s <= 600 ? 20 * s : Math.max(0, 12000 - 80 * (s - 600)); lit(o, 'prod', 'proj'); o.on.fila = 'bad';
          o.rows.fila = act('fila do projetor', 'SEM LIMITE', [thou(q) + ' eventos', 'bad'], [`atraso: ${thou(q / 100)} s`, 'bad']); o.rows.fila.bar = [Math.min(1, q / 12000), thou(q), 'bad'];
          qcols(o, s, x => x <= 600 ? 20 * x : Math.max(0, 12000 - 80 * (x - 600)), 'bad'); pk(o, WAY.pf, (t * 0.35) % 1, '', 'bad');
          o.cnt = [['NA FILA', thou(q), 'bad'], ['ATRASO', `${thou(q / 100)} s`, 'bad'], ['TEMPO', minsec(s), 'dim']];
          o.res = s > 600 ? [['drenando a 80/s: 150 s', 'dim']] : [['ninguém foi avisado', 'bad']]; } },
    ],
  };
  // colunas da simulação dos 1.000 clientes até a janela atual
  function jcols(o, k, upto) {
    const [calls] = JIT[k], n = Math.floor(clamp(upto) * 100) + 1, x0 = 34, p = 8.3;
    for (let i = 0; i < 101; i++) { const h = i < n ? Math.max(i < n && calls[i] ? 1.2 : 0.4, 92 * calls[i] / 1000) : 0;
      if (h > 0) col(o, x0 + i * p, 6.2, h, i < 20 ? 'bad' : 'acc', 324, 40); }
    T(o, [x0 + 10 * p, 386, 6], 'PSP fora', 'bad'); T(o, [x0 + 60 * p, 386, 6], '200/s · 20 por janela', 'dim');
  }
  function jstep(k, title, nextName, code, story, look, key) {
    const [calls, cum] = JIT[k], peak = Math.max(...calls.slice(20));
    return { id: k, dur: 9, title, yk: 'A ESPERA', code, story, look, key, act: nextName ? [nextName, 'próxima estratégia'] : null,
      f(o, t) { const u = lin(t, 0.4, 7.4, 0, 1), i = Math.floor(u * 100); lit(o, 'app'); o.on.pspa = i < 20 ? 'bad' : 1;
        if (i >= 20) o.rows.pspa = act('PSP', '200/s', ['de pé desde 2,0 s', 'acc']);
        jcols(o, k, u); pk(o, WAY.long, (clk * 0.6) % 1, '', i < 20 ? 'bad' : '');
        let tot = 0, pk_ = 0; for (let j = 0; j <= i; j++) { tot += calls[j]; if (j >= 20) pk_ = Math.max(pk_, calls[j]); }
        o.cnt = [['CHAMADAS', thou(tot), k === 'fixo' && tot > 20000 ? 'bad' : ''], ['PICO/100 ms DEPOIS DE 2 s', i >= 20 ? thou(pk_) : '…', pk_ >= 500 ? 'bad' : 'dim'], ['CONCLUÍDOS', `${thou(cum[i])} (${dec(i / 10, 1)} s)`, 'dim']];
        o.res = u >= 1 ? (k === 'exp' ? [['só 40 de 1.000 no prazo', 'bad'], ['o jitter espalha as ondas', 'acc']] : [[`pico ${thou(peak)} · ${thou(cum[100])} concluídos`, peak >= 500 ? 'bad' : 'acc']]) : [];
        if (u > 0.3) { let bi = 20; for (let j = 20; j <= i; j++) if (calls[j] > calls[bi]) bi = j; T(o, [34 + bi * 8.3 + 3, 340, 14 + 92 * calls[bi] / 1000], `pico ${thou(calls[bi])}`, calls[bi] >= 500 ? 'bad' : 'acc'); } } };
  }
  // breaker: as colunas por segundo (altura = chamadas ao PSP-A naquele segundo; plaquinha = falhas rápidas)
  function bstep(id, title, s0, s1, yk, code, story, look, key) {
    return { id, dur: 9, title, yk, code, story, look, key,
      f(o, t) { const s = lin(t, 0.4, 7.4, s0, s1), st = brkState(s), [calls, ff] = brkAt(s); lit(o, 'app'); o.sw = st;
        if (s < 90) pspSlow(o); else { o.on.pspa = 1; o.rows.pspa = act('PSP-A', '1 s', ['voltou: 180 ms', 'acc']); }
        o.on.pag = 1; o.rows.pag = act('pagamentos', '2,0 s', [st === 'open' ? 'falha rápida' : st === 'half' ? '5 sondas' : 'chama o PSP-A', st === 'open' ? 'bad' : 'hi'], ['pool de 50', 'dim']);
        o.pool.n = s < 1.3 ? Math.min(30, 30 * s) : s < 2.4 ? Math.max(0, 30 - (s - 1.3) * 27) : st === 'half' ? 5 : s > 93.91 ? 5 : 0;
        const pass = st !== 'open'; bm(o, CAB.pa1, { on: pass, tone: s < 90 ? 'bad' : '' }); bm(o, CAB.pa2, { on: pass, tone: s < 90 ? 'bad' : '' });
        if (pass) pk(o, WAY.pa, (clk * 0.8) % 1, s < 90 ? '8.000 ms → timeout' : '180 ms', s < 90 ? 'bad' : '');
        for (let k = 0; k < 100 && k < s; k++) { const a = BRK[Math.min(BRK.length - 1, 2 * k)], b = BRK[Math.min(BRK.length - 1, 2 * k + 2)], c = b[0] - a[0], f = b[1] - a[1];
          if (c > 0) col(o, 34 + k * 8.4, 6.4, Math.max(2, 70 * c / 30), k < 93 ? 'bad' : 'acc', 324, 40); else if (f > 0) col(o, 34 + k * 8.4, 6.4, 1.2, 'dim', 324, 40); }
        T(o, [34 + 2 * 8.4, 386, 6], '0 s', 'dim'); T(o, [34 + 90 * 8.4, 386, 6], '90 s', 'dim');
        const NM = { closed: 'fechado', open: 'aberto', half: 'meio-aberto' };
        o.cnt = [['ESTADO', NM[st], st === 'open' ? 'bad' : ''], ['RELÓGIO', clock(s, 2)], ['CHAMADAS AO PSP-A', thou(calls), 'dim']];
        if (s0 >= 1.3) o.cnt[2] = id === 'fecha' && s >= 99.5 ? ['CHAMADAS AO PSP-A', '237 (sem: 3.000)'] : ['FALHAS RÁPIDAS', thou(ff), 'dim'];
        o.res = id === 'fecha' && s >= 99.5 ? [['237 chamadas em vez de 3.000', 'acc'], ['2.763 falhas rápidas', 'dim']] : st === 'open' ? [['nada passa: falha rápida', 'bad']] : st === 'half' ? [['testando com 5 sondas', 'acc']] : [];
        T(o, [732, CY, 50], NM[st], st === 'open' ? 'bad' : 'acc'); } };
  }
  // degradação: barras da demanda e dos 4 níveis
  const LV = [['nível 0', 1000], ['nível 1', 1333], ['nível 2', 1667], ['nível 3 · CDN', 1950]];
  function dbars(o, demand, lv) {
    bars(o, [[`demanda ${thou(demand)}`, demand, 2000, demand > LV[lv][1] ? 'bad' : 'acc'], ...LV.map(([n, v], i) => [i === 3 ? n : `${n} · ${thou(v)}`, v, 2000, i === lv ? 'acc' : 'dim'])], 480, 82, 50);
  }
  function dstep(lv, title, nextName, code, story, look, key) {
    return { id: 'n' + lv, dur: 6, title, yk: `NÍVEL ${lv}`, code, story, look, key, act: [nextName, lv < 3 ? 'desliga mais' : 'a variante tarde demais'],
      f(o, t) { lit(o, 'app', 'gw', 'bff'); dbars(o, 1300, lv);
        const cdn = lv === 3; o.on.cat = cdn ? 0 : 1; if (cdn) { o.on.cdn = 1; pk(o, WAY.cdn, (t * 0.5) % 1, ''); } else pk(o, WAY.cat, (t * 0.5) % 1, '');
        const cap = [1000, 1333, 1667][lv] || 0;
        o.rows.cat = act('catálogo', cdn ? 'FORA DO CAMINHO' : `NÍVEL ${lv}`, [cdn ? 'quase sem tráfego' : `${[10, 7.5, 6][lv].toString().replace('.', ',')} ms → ${thou(cap)} req/s`, 'dim'],
          ['recomendações: desligadas', 'dim'], [lv >= 2 ? 'busca simplificada' : 'busca completa', lv >= 2 ? 'dim' : 'hi'], [lv >= 2 ? 'avaliações: desligadas' : 'avaliações: ligadas', lv >= 2 ? 'dim' : 'hi']);
        o.cnt = [['CAPACIDADE', cdn ? 'a da CDN' : `${thou(cap)} req/s`], ['DEMANDA', '1.300 req/s', 'dim'], ['DESLIGADO', ['', 'recomendações', '+ busca, avaliações', 'tudo menos a vitrine'][lv], 'dim']];
        o.res = [[lv === 1 ? 'o nível mínimo que segura' : cdn ? 'a CDN segura a vitrine' : 'segura, com folga', 'acc']]; } };
  }
  // backpressure: a fila e as colunas do tamanho da fila no tempo (uma a cada 10 s, até 750 s, escala de 12.000)
  function fila(o, q, st) { o.rows.fila = act('fila do projetor', 'LIMITE 5.000', [`${thou(q)} eventos`, q >= 5000 ? 'bad' : 'hi'], [st, q >= 5000 ? 'bad' : 'dim']); o.rows.fila.bar = [q / 12000, thou(q), q >= 5000 ? 'bad' : 'acc', 5000 / 12000]; }
  function qcols(o, s, qf, tone = 'acc') {
    for (let k = 0; k * 10 <= s && k < 76; k++) { const q = qf(k * 10); col(o, 34 + k * 11, 8.4, Math.max(0.6, 92 * q / 12000), q >= 5000 && tone === 'acc' ? 'bad' : tone, 324, 40); }
    T(o, [34, 386, 6], '0 s', 'dim'); T(o, [34 + 25 * 11, 386, 6], '250 s', 'dim'); T(o, [34 + 60 * 11, 386, 6], '10 min', 'dim');
  }
  function pstep(id, title, nextName, yk, code, story, look, key, prodSt) {
    return { id, dur: 7, title, yk, code, story, look, key, act: [nextName, id === 'descartar' ? 'e se der errado' : 'outra política'],
      f(o, t) { lit(o, 'prod', 'proj'); o.on.fila = 1; fila(o, 5000, id === 'bloquear' ? 'cheia: o envio espera' : id === '429' ? 'cheia: responde 429' : 'cheia: descarta SHEDDABLE');
        o.rows.prod = act('Kafka', 'PRODUTOR', ['eventos de pedidos', 'dim'], [prodSt, id === 'bloquear' ? 'acc' : 'bad']);
        qcols(o, 300, x => Math.min(5000, 20 * x));
        pk(o, WAY.pf, (t * 0.3) % 0.5 + 0.5, '100/s');
        if (id === 'bloquear') pk(o, WAY.pf, (t * 0.3) % 0.5, '');
        if (id === '429') { const f = (t * 0.45) % 1; pk(o, WAY.pf.slice(0, 4).reverse(), f, '429', 'bad'); }
        if (id === 'descartar') { pk(o, WAY.pf, (t * 0.3) % 0.4, 'pedido'); pk(o, WAY.pf.slice(0, 3), (t * 0.4 + 0.5) % 1, 'marketing', 'bad'); }
        o.cnt = [['NA FILA', '5.000'], ['ENTRAM', id === 'descartar' ? 'só o que importa' : '100/s', 'dim'], ['SINAL', { bloquear: 'espera', 429: '429 + Retry-After', descartar: 'recusa SHEDDABLE' }[id], 'dim']];
        o.res = [['a sobrecarga vira sinal', 'acc']]; } };
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
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (...i) => i.includes(step) ? ' class="on"' : '';
  const DATA = {
    timeout: () => `<table class="h3-sum"><tr><th>timeout</th><th>em voo (30/s)</th><th>pool de 50</th></tr><tr${on_(0)}><td>180 ms (normal)</td><td>5,4</td><td>sobra</td></tr><tr${on_(3)}><td>1,0 s</td><td>30</td><td>cabe</td></tr><tr><td>1,67 s</td><td>50</td><td>timeout crítico</td></tr><tr${on_(2)}><td>2,0 s</td><td>60</td><td>satura · 484 recusadas em 100 s</td></tr><tr${on_(1)}><td>8,0 s</td><td>240</td><td>satura em 1,67 s</td></tr></table><li>Latência do PSP-A (exemplo): p50 <b>180 ms</b>, p99 <b>400 ms</b>, p99,9 <b>700 ms</b>; 0,1% de falsos timeouts → p99,9 + folga = <b>1 s</b> (AWS)</li><li>Prazos: app 5 s › <code>gw-loja</code> 3 s › <code>bff-app</code> 2,8 s › <code>pedidos</code> 2,5 s › <code>pagamentos</code> 2,0 s › PSP 1,0 s por tentativa</li><li><code>Idempotency-Key: "3f9a2c7e-5b1d-4e8a-9c3f-7a2b4d6e8f10"</code> + CRLF = <b>57 B</b></li><li>PostgreSQL 14.24: 1ª chegada <code>INSERT 0 1</code>; repetição <code>INSERT 0 0</code> e a resposta guardada (<code>201</code>, <code>pedido_id 1058</code>); corpo diferente → <code>422</code>; ainda processando → o <code>INSERT</code> concorrente espera o commit da primeira</li><li>Stripe guarda a chave por pelo menos 24 h e aceita até 255 caracteres</li>`,
    retry: () => `<table class="h3-sum"><tr><th>camadas × tentativas</th><th>por clique</th><th>a 30/s</th></tr><tr${on_(1, 2)}><td>3 × 3</td><td>27</td><td>810/s (20,2 × 40/s)</td></tr><tr${on_(2)}><td>3 × 2</td><td>8</td><td>240/s</td></tr><tr${on_(2, 3)}><td>1 × 3</td><td>3</td><td>90/s</td></tr><tr${on_(4)}><td>orçamento 10%</td><td>1,1</td><td>33/s</td></tr></table><li>Backoff exponencial de base 100 ms: esperas 100, 200, 400, 800, 1.600 ms (instantes 0,1 · 0,3 · 0,7 · 1,5 · 3,1 s)</li><li>Repete só em <code>503</code>, <code>504</code>, timeout e conexão recusada, e só com <code>Idempotency-Key</code></li><li>Google SRE: orçamento por processo, exemplo de 60 retentativas por minuto</li><li>Falha metaestável: Bronson et al., HotOS 2021 (link não conferido)</li>`,
    jitter: () => `<table class="h3-sum"><tr><th>estratégia</th><th>chamadas</th><th>pico</th><th>recusadas*</th><th>concluídos</th></tr><tr${on_(1)}><td>fixo 100 ms</td><td>45.500</td><td>1.000</td><td>24.500</td><td>1.000</td></tr><tr${on_(5)}><td>exp. sem jitter</td><td>6.980</td><td>1.000</td><td>1.940</td><td>40</td></tr><tr${on_(2)}><td>full jitter</td><td>7.540</td><td>84</td><td>687</td><td>1.000</td></tr><tr${on_(3)}><td>equal jitter</td><td>7.162</td><td>130</td><td>1.085</td><td>993</td></tr><tr${on_(4)}><td>decorrelated</td><td>7.590</td><td>125</td><td>1.397</td><td>999</td></tr></table><li>* recusadas com o PSP já de pé; pico = maior janela de 100 ms depois que o PSP volta</li><li>Simulação (Python, semente 7): 1.000 clientes em t = 0; PSP fora até 2,0 s, depois 200/s; prazo de 10 s; base 100 ms; teto 5 s</li><li>AWS Architecture Blog, "Exponential Backoff And Jitter": o sem jitter é "o claro perdedor"; a ordem entre <i>equal</i> e <i>full</i> é só deste cenário</li><li><b>Correção ao artigo:</b> o "jitter incremental" (0–4 s, 2–6 s, 6–10 s) não é nenhum dos três algoritmos; faltam o teto e as ondas do backoff sem jitter</li>`,
    breaker: () => `<table class="h3-sum"><tr><th>instante</th><th>estado</th></tr><tr${on_(1)}><td>1,3 s</td><td>abre</td></tr><tr${on_(3)}><td>31,3 → 32,43 s</td><td>meio-aberto → reabre</td></tr><tr${on_(3)}><td>62,47 → 63,6 s</td><td>meio-aberto → reabre</td></tr><tr${on_(4)}><td>90 s</td><td>o PSP-A volta</td></tr><tr${on_(4)}><td>93,6 → 93,91 s</td><td>meio-aberto → fecha</td></tr></table><li>Simulação: 30 req/s por 100 s, PSP-A em 8 s até 90 s, pool de 50, timeout de 1 s. Chamadas ao PSP-A: <b>237</b> (54 durante a falha, 183 depois) contra <b>3.000</b> sem breaker; falhas rápidas: <b>2.763</b></li><li>Sem breaker: timeout 2 s → 484 recusadas pelo pool; timeout 8 s → 2.260. Com breaker e timeout de 2 s: abre em 2,3 s e 11 ainda são recusadas</li><li>Resilience4j (padrões): <code>failureRateThreshold</code> 50, <code>slidingWindowSize</code> 100, <code>minimumNumberOfCalls</code> 100, <code>waitDurationInOpenState</code> 60 s, <code>permittedNumberOfCallsInHalfOpenState</code> 10, <code>slowCallDurationThreshold</code> 60 s. A loja: janela 20, mínimo 10, 30 s, 5 sondas, lenta = &gt; 1 s</li>`,
    fallback: () => `<table class="h3-sum"><tr><th>fallback</th><th>sacrifica</th><th>na loja</th></tr><tr${on_(1)}><td>reativo</td><td>latência</td><td>PSP-B (300 ms × 180 ms)</td></tr><tr${on_(2)}><td>valor de reserva</td><td>precisão</td><td>frete de tabela: Rio 12,00</td></tr><tr${on_(2)}><td>contratual</td><td>custo</td><td>R$ 0,10 × R$ 0,03: +R$ 1.260 em 10 min</td></tr><tr${on_(3)}><td>proativo</td><td>1% do tráfego</td><td>0,3/s = 18/min no PSP-B</td></tr></table><li>Pedido 1058 (Caio, Rio, 20:20:04): 3 canecas azuis 59,70 + frete 12,00 = <b>71,70</b>, cartão; caneca 35 → 32</li><li>AWS, "Avoiding fallback in distributed systems": fallback raramente exercitado tem defeito latente e pode piorar a falha; "caminhos de código exercitados continuamente"</li><li>Snapshot (limite de crédito do último valor conhecido) e fluxo assíncrono (e-mail para a fila) são os outros fallbacks do artigo</li>`,
    degradacao: () => `<table class="h3-sum"><tr><th>nível</th><th>CPU/página</th><th>por réplica</th><th>10 réplicas</th></tr><tr${on_(0, 1, 5)}><td>0 · normal</td><td>10 ms</td><td>100 req/s</td><td>1.000</td></tr><tr${on_(2)}><td>1 · sem recomendações</td><td>7,5 ms</td><td>133</td><td>1.333</td></tr><tr${on_(3)}><td>2 · + busca simples, sem avaliações</td><td>6 ms</td><td>167</td><td>1.667</td></tr><tr${on_(4)}><td>3 · página estática</td><td>CDN</td><td>—</td><td>a da CDN</td></tr></table><li>Rajada de <b>1.300 req/s</b> por poucos segundos às 20:20 (a newsletter); o pico medido no módulo 14 é 640 e o projetado, 950</li><li>HPA: 10 → 14 réplicas = 1.400 req/s, mas leva minutos</li><li>Criticidade (Google SRE): <code>CRITICAL_PLUS</code>, <code>CRITICAL</code>, <code>SHEDDABLE_PLUS</code>, <code>SHEDDABLE</code>; checkout › catálogo › recomendações e "meus pedidos" › relatórios</li>`,
    backpressure: () => `<table class="h3-sum"><tr><th>política</th><th>o que acontece</th></tr><tr${on_(1)}><td>fila de 5.000</td><td>enche em 250 s; atraso máx. 50 s; drena em 62,5 s</td></tr><tr${on_(2)}><td>bloquear</td><td>o produtor anda a 100/s</td></tr><tr${on_(3)}><td><code>429</code> + <code>Retry-After</code></td><td>o produtor espera o tempo pedido</td></tr><tr${on_(4)}><td>descartar por prioridade</td><td>recusa o <code>SHEDDABLE</code> primeiro</td></tr><tr${on_(5)}><td>ilimitada</td><td>10 min: 12.000, 120 s de atraso; drena em 150 s</td></tr></table><li>Chegam 120 eventos/s, o projetor <code>meus-pedidos</code> processa 100/s: déficit de 20/s</li><li>RFC 6585 (<code>429</code>) e RFC 9110 (<code>Retry-After</code>); Reactive Streams: <code>request(n)</code></li><li><b>Correção ao artigo:</b> "enfileirar em memória" sem limite não é backpressure; esconde a sobrecarga</li>`,
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
  function readout() { if (active !== 'chamadas') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
