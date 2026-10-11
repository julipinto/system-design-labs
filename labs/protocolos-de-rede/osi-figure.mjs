// Figura OSI: duas torres de 7 andares (o celular da Lena em São Paulo e o do irmão em Tóquio),
// cada uma com um monta-carga na frente. Descendo, cada andar põe um envelope em volta da foto
// (a carga vira uma pirâmide de degraus = encapsulamento). Embaixo vira bits num cabo com 3 roteadores.
// Subindo do outro lado, cada andar tira o seu envelope.
//
//   node osi-figure.mjs            -> escreve osi-figure.html (página de teste, tema escuro)
//   node osi-figure.mjs --light    -> osi-figure-light.html
//   import { buildOsiFigure } from "./osi-figure.mjs" -> { css, html, script } para a página do módulo

import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../tools/anatomy/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(join(HERE, "osi-data.js"), "utf8");
const KIT_SRC = readFileSync(join(HERE, "../../tools/anatomy/iso-kit.mjs"), "utf8").replace(/^export /gm, "");

const WIDTH = 760;
const HEIGHT = 540;

// ---------- mundo ----------
const H = 28; // altura de um andar
const PLINTH = 6;
const floorZ = (L) => PLINTH + (L - 1) * H; // topo da prateleira do andar L
const TOP = PLINTH + 7 * H; // 202, base do tampo
const CAP_H = 4;
const SHAFT_TOP = TOP - 6; // viga logo abaixo do tampo, para o celular no topo ficar à vista
const ROPE_TOP = SHAFT_TOP - 10;

const BASE = { x: -214, y: -52, w: 428, d: 140, r: 9 };
const BASE_H = 10;
const FOOT_H = 6;

const TW = 64;
const TD = 52;
const TOWERS = { sp: -150, tk: 150 };
const towerPlan = (cx) => ({ x: cx - TW / 2, y: -40, w: TW, d: TD, r: 2 });

const POST_Y = 20; // trilhos do monta-carga
const POST_DX = 29;
const PAY_Y = 48; // centro da carga sobre a plataforma
const PLAT = (cx) => ({ x: cx - 27, y: 23, w: 54, d: 50, r: 2 });

// envelopes: índice 1..6 = camadas 7..2 (o 6 é o quadro de enlace, o mais externo)
const SHELL_T = 3;
const shellW = (i) => 10 + 6 * i;
const CORE = { w: 10, h: 8 };
const SQUEEZE = 0.72; // 7,68 MB -> 313 KB, encolhimento visual do núcleo
const layerOfShell = (i) => 8 - i;

const ROUTERS = [-54, 0, 54];
const CABLE_Y = 40;
const CLIPS = []; // posições das presilhas (preenchido por cables())
const XCVR = { sp: { x: -116, y: 30, w: 18, d: 20, r: 2 }, tk: { x: 98, y: 30, w: 18, d: 20, r: 2 } };
const CABLE_RUNS = [
  [-98, -63],
  [-45, -9],
  [9, 45],
  [63, 98],
];

const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -BASE_H - FOOT_H, 0),
    ...k.boxCorners({ x: -190, y: -48, w: 380, d: 125, r: 0 }, 0, TOP + 12),
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 60 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (pts) => [...pts].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));

// ---------- base ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 26))) {
    out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(BASE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));

  // régua na frente: 1 tick a cada 6, maior a cada 5
  const strip = { x: -102, y: BASE.y + BASE.d - 13, w: 204, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 6, 5, strip.y + 0.7, 0.6, [1.8, 3.4], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 1.6, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.6, strip.y + 3, 0.6])], { size: 0.4 }));

  // plaquetas de identificação na frente de cada torre (3 linhas de "texto")
  for (const cx of [TOWERS.sp, TOWERS.tk]) {
    const plate = { x: cx - 18, y: BASE.y + BASE.d - 13, w: 36, d: 8, r: 1.2 };
    out.push(S(k.slabOf(plate, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
    out.push(L(k.planOutline(k.insetPlan(plate, 1.4), 0.8, P, 3), { tone: "faint" }));
    out.push(
      L(
        [
          [cx - 13, plate.y + 2.8, 14],
          [cx - 13, plate.y + 4.6, 22],
          [cx - 13, plate.y + 6.2, 10],
        ]
          .map(([x, y, len]) => k.lineOnTop([x, y], [x + len, y], 0.8, P))
          .join(""),
        { tone: "lo", free: true },
      ),
    );
    out.push(D([at([plate.x + 2.4, plate.y + 4, 0.8]), at([plate.x + plate.w - 2.4, plate.y + 4, 0.8])], { size: 0.4 }));
  }
  return out.join("");
}

// ---------- torre (o celular) ----------
function posts(plan) {
  const x0 = plan.x - 2, x1 = plan.x + plan.w + 2, y0 = plan.y - 2, y1 = plan.y + plan.d + 2;
  return { back: [x0, y0], right: [x1, y0], left: [x0, y1], front: [x1, y1], x0, x1, y0, y1 };
}
const postSolid = ([x, y]) => S(k.slabOf({ x: x - 2, y: y - 2, w: 4, d: 4, r: 0.8 }, 4, TOP - 4, P, 2, 0.3), { tone: "mid" });

function shelfContents(cx, plan, Lyr, side) {
  const out = [];
  const z = floorZ(Lyr);
  if (Lyr >= 2) {
    // a pilha de envelopes daquele andar, no tamanho do envelope que ele coloca
    const w = shellW(8 - Lyr);
    const sp = { x: plan.x + 5, y: plan.y + 4, w: Math.min(w, 40), d: Math.min(w, 26), r: 1 };
    for (let j = 0; j < 4; j++) {
      out.push(S(k.slabOf(sp, z + j * 1.3, 1.1, P, 2), { tone: j === 3 ? "hi" : "mid", crease: "lo" }));
    }
    out.push(L(k.planOutline(k.insetPlan(sp, 1.6), z + 5.2, P, 2), { tone: "faint" }));
  } else {
    // camada 1: um carretel de cabo
    const [rx, ry] = [plan.x + 18, plan.y + 16];
    out.push(S(k.cylinder(rx, ry, 11, z, 1.6, P, 40), { tone: "mid" }));
    out.push(S(k.cylinder(rx, ry, 6.5, z + 1.6, 7, P, 32), { tone: "hi", crease: "none" }));
    out.push(L([3, 4.6, 6.2, 7.8].map((h) => k.sideArc(rx, ry, 6.5, z + h, P, 24)).join(""), { tone: "lo" }));
    out.push(S(k.cylinder(rx, ry, 11, z + 8.6, 1.6, P, 40), { tone: "mid" }));
    out.push(L(k.ring(rx, ry, 2.2, z + 10.2, P, 16), { tone: "lo" }));
  }
  // marcas do número do andar: L pontos na frente da prateleira
  const tally = [];
  for (let j = 0; j < Lyr; j++) tally.push(at([plan.x + 5 + j * 2.8, plan.y + plan.d - 3, z]));
  out.push(D(tally, { size: 0.55, tone: "mid" }));
  // lâmpada do andar
  const [lx, ly] = [plan.x + plan.w - 6, plan.y + plan.d - 6];
  out.push(S(k.cylinder(lx, ly, 2.4, z, 1.2, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(lx, ly, 1.6, z + 1.2, 1.8, P, 18), { tone: "mid" }));
  out.push(`<g class="osi-lamp" data-lamp="${side}-${Lyr}">${D([at([lx, ly, z + 3])], { size: 1.3, tone: "hi" })}</g>`);
  return out.join("");
}

function phone(cx, side) {
  // o celular deitado sobre o tampo: a aplicação mora no topo
  const out = [];
  const z = TOP + CAP_H;
  const body = { x: cx - 16, y: -32, w: 32, d: 38, r: 5 };
  out.push(S(k.slabOf(body, z, 2.6, P, 6, 0.6), { tone: "mid" }));
  const screen = k.insetPlan(body, 2.4);
  out.push(S(k.slabOf(screen, z + 2.6, 0.2, P, 6), { tone: "lo", crease: "none" }));
  out.push(`<g class="osi-screen" data-screen="${side}">${S(k.slabOf(k.insetPlan(screen, 2), z + 2.8, 0.2, P, 4), { tone: "hi", lit: true, crease: "none" })}</g>`);
  out.push(D([at([cx + 11.5, body.y + 4.6, z + 2.8])], { size: 0.6, tone: "mid" }));
  out.push(S(k.slabOf({ x: body.x + body.w, y: body.y + 9, w: 0.8, d: 7, r: 0.3 }, z + 0.6, 1.4, P, 2), { tone: "lo", crease: "none" }));
  return out.join("");
}

function tower(side) {
  const cx = TOWERS[side];
  const plan = towerPlan(cx);
  const p = posts(plan);
  const out = [];
  const grown = k.insetPlan(plan, -5);
  out.push(`<path class="iso-halo" d="${k.haloOf(grown, 0, 4, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.slabOf(grown, 0, 4, P, 4, 0.6), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(grown, 2.4), 4, P, 4), { tone: "faint" }));
  out.push(postSolid(p.back), postSolid(p.right), postSolid(p.left));
  for (let Lyr = 1; Lyr <= 7; Lyr++) {
    const z = floorZ(Lyr);
    out.push(S(k.slabOf(plan, z - 2, 2, P, 3, 0.4), { tone: "mid" }));
    out.push(shelfContents(cx, plan, Lyr, side));
  }
  // contraventamento em X na face lateral visível (+x), de poste a poste
  const xb = p.x1;
  const braces = [];
  for (let Lyr = 1; Lyr <= 7; Lyr++) {
    const z0 = floorZ(Lyr), z1 = Lyr === 7 ? TOP : floorZ(Lyr + 1) - 2;
    braces.push(k.segment([xb, p.y0, z0], [xb, p.y1, z1], P), k.segment([xb, p.y0, z1], [xb, p.y1, z0], P));
  }
  out.push(L(braces.join(""), { tone: "lo" }));
  out.push(postSolid(p.front));
  const cap = k.insetPlan(plan, -4);
  out.push(S(k.slabOf(cap, TOP, CAP_H, P, 4, 0.8), { tone: "mid" }));
  out.push(D(k.corners(cap, 3).map(([x, y]) => at([x, y, TOP + CAP_H])), { size: 0.45 }));
  out.push(phone(cx, side));
  return out.join("");
}

// ---------- monta-carga ----------
function shaft(side) {
  const cx = TOWERS[side];
  const out = [];
  const left = [cx - POST_DX, POST_Y], right = [cx + POST_DX, POST_Y];
  // régua de andares no poste esquerdo: um traço por andar, de borda a borda
  const ruler = { x: cx - POST_DX - 6.5, y: POST_Y - 1.5, w: 3, d: 3, r: 0.4 };
  out.push(S(k.slabOf(ruler, 4, TOP - 4, P, 2), { tone: "lo", crease: "none" }));
  const marks = [];
  for (let Lyr = 1; Lyr <= 7; Lyr++) {
    const z = floorZ(Lyr);
    marks.push(k.segment([ruler.x, ruler.y + ruler.d, z], [ruler.x + ruler.w, ruler.y + ruler.d, z], P));
  }
  out.push(L(marks.join(""), { tone: "mid" }));
  for (const [x, y] of [left, right]) {
    out.push(S(k.cylinder(x, y, 3.2, 0, 4, P, 20), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 1.8, 4, SHAFT_TOP - 4, P, 16), { tone: "mid", crease: "none" }));
  }
  const beam = { x: cx - POST_DX - 4, y: POST_Y - 3, w: POST_DX * 2 + 8, d: 6, r: 1 };
  out.push(S(k.slabOf(beam, SHAFT_TOP, 5, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([beam.x + 3, POST_Y, SHAFT_TOP + 5]), at([beam.x + beam.w - 3, POST_Y, SHAFT_TOP + 5])], { size: 0.45 }));
  // motor do guincho com tambor serrilhado
  // guincho pendurado sob a viga: caixa do motor e tambor serrilhado
  const motor = { x: cx - 9, y: POST_Y - 4, w: 18, d: 8, r: 2 };
  out.push(S(k.slabOf(motor, ROPE_TOP, SHAFT_TOP - ROPE_TOP, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.sideSeam(motor, ROPE_TOP + 4, P, 4), { tone: "faint" }));
  out.push(S(k.cylinder(cx + 14, POST_Y, 3.4, ROPE_TOP + 1, SHAFT_TOP - ROPE_TOP - 1, P, 24), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(cx + 14, POST_Y, 3.4, ROPE_TOP + 1, SHAFT_TOP, 20, P), { tone: "lo" }));
  return out.join("");
}

const ropeAt = (cx, zCar) => k.segment([cx, POST_Y, ROPE_TOP], [cx, POST_Y, zCar], P);

function car(side) {
  const cx = TOWERS[side];
  const out = [];
  const plat = PLAT(cx);
  // carro e buchas nos trilhos
  out.push(S(k.slabOf({ x: cx - 25, y: POST_Y - 3, w: 50, d: 6, r: 1 }, -10, 10, P, 3, 0.5), { tone: "mid" }));
  for (const x of [cx - POST_DX, cx + POST_DX]) {
    out.push(S(k.cylinder(x, POST_Y, 3.2, -10, 10, P, 20), { tone: "mid" }));
    out.push(L(k.sideArc(x, POST_Y, 3.2, -5, P, 14), { tone: "faint" }));
  }
  out.push(S(k.slabOf(plat, -3, 3, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plat, 3), 0, P, 3), { tone: "faint" }));
  out.push(D(k.corners(plat, 2.4).map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  // envelopes, do mais externo (baixo) para o núcleo (topo)
  for (let i = 6; i >= 1; i--) {
    const w = shellW(i);
    const sp = { x: cx - w / 2, y: PAY_Y - w / 2, w, d: w, r: 1.2 };
    const label = { x: sp.x + 1.5, y: sp.y + 1.5, w: w - 3, d: w - 3, r: 0.6 };
    out.push(
      `<g class="osi-shell" data-side="${side}" data-shell="${i}">${S(k.slabOf(sp, 0, SHELL_T, P, 3, 0.4), {
        tone: "mid",
        crease: "faint",
      })}${L(k.planOutline(label, SHELL_T, P, 2), { tone: "faint" })}</g>`,
    );
  }
  out.push(`<g class="osi-core" data-side="${side}">${coreSvg(cx, 1)}</g>`);
  // borda da plataforma (fica na frente da carga)
  out.push(S(k.slabOf({ x: plat.x, y: plat.y + plat.d - 2, w: plat.w, d: 2, r: 0.6 }, 0, 1.6, P, 2), { tone: "mid" }));
  return out.join("");
}

function coreSvg(cx, f) {
  const w = CORE.w * f, h = CORE.h * (0.55 + 0.45 * f);
  const plan = { x: cx - w / 2, y: PAY_Y - w / 2, w, d: w, r: 1 };
  return S(k.slabOf(plan, 0, h, P, 3, 0.4), { tone: "hi", lit: true }) + L(k.planOutline(k.insetPlan(plan, 1.6), h, P, 2), { tone: "lo" });
}

// ---------- cabo, roteadores e transceptores ----------
function cables() {
  const out = [];
  for (const [x0, x1] of CABLE_RUNS) {
    // canaleta + cabo
    out.push(S(k.slabOf({ x: x0, y: CABLE_Y - 5, w: x1 - x0, d: 10, r: 1 }, 0, 0.8, P, 2), { tone: "lo", crease: "none" }));
    out.push(S(k.slabOf({ x: x0, y: CABLE_Y - 1.5, w: x1 - x0, d: 3, r: 1.4 }, 0.8, 2.4, P, 3), { tone: "mid", crease: "none" }));
  }
  // presilhas sobre o cabo
  const clips = [];
  for (const [x0, x1] of CABLE_RUNS) {
    const n = x1 - x0 > 30 ? 2 : 1;
    for (let j = 1; j <= n; j++) clips.push(x0 + ((x1 - x0) * j) / (n + 1));
  }
  CLIPS.push(...clips);
  for (const x of clips) {
    out.push(S(k.slabOf({ x: x - 1.6, y: CABLE_Y - 4, w: 3.2, d: 8, r: 0.6 }, 0.8, 3.6, P, 2), { tone: "mid" }));
    out.push(D([at([x, CABLE_Y - 3, 4.4]), at([x, CABLE_Y + 3, 4.4])], { size: 0.4 }));
  }
  return out.join("");
}

function router(x, n) {
  const out = [];
  const plan = { x: x - 9, y: CABLE_Y - 9, w: 18, d: 18, r: 2 };
  out.push(`<path class="iso-halo" d="${k.haloOf(plan, 0, 1, P)}" style="filter:blur(2px)"/>`);
  out.push(S(k.slabOf(plan, 0, 11, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.sideSeam(plan, 3, P, 4), { tone: "faint" }));
  out.push(D(k.dotGrid(x - 5, CABLE_Y - 5, 5, 4, 2.4, 11, P), { size: 0.4, tone: "lo" }));
  for (const ax of [x - 6, x + 6]) {
    out.push(S(k.cylinder(ax, CABLE_Y - 6, 1.2, 11, 1, P, 12), { tone: "lo" }));
    out.push(S(k.cylinder(ax, CABLE_Y - 6, 0.6, 12, 12, P, 10), { tone: "mid", crease: "none" }));
  }
  const lights = [-4, 0, 4].map((dx) => at([x + dx, CABLE_Y + 9, 7]));
  out.push(D(lights.slice(0, 2), { size: 0.55, tone: "lo" }));
  out.push(`<g class="osi-lamp" data-lamp="r-${n}">${D([lights[2]], { size: 0.9, tone: "hi" })}</g>`);
  return out.join("");
}

function transceiver(side) {
  const plan = XCVR[side];
  const out = [];
  const ax = plan.x + plan.w / 2, ay = plan.y + 5;
  out.push(S(k.slabOf(plan, 0, 10, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2.4), 10, P, 3), { tone: "faint" }));
  out.push(S(k.cylinder(ax, ay, 1.6, 10, 1.4, P, 14), { tone: "lo" }));
  out.push(S(k.cylinder(ax, ay, 0.8, 11.4, 14, P, 10), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(ax, ay, 1.5, 25.4, 1.6, P, 12), { tone: "mid" }));
  out.push(D([at([plan.x + 4, plan.y + plan.d, 6]), at([plan.x + 7, plan.y + plan.d, 6])], { size: 0.5, tone: "lo" }));
  out.push(`<g class="osi-lamp" data-lamp="x-${side}">${D([at([plan.x + 11, plan.y + plan.d, 6])], { size: 0.9, tone: "hi" })}</g>`);
  return out.join("");
}

// alvos de clique: um por andar em cada torre
function hits() {
  const out = [];
  for (const side of ["sp", "tk"]) {
    const plan = k.insetPlan(towerPlan(TOWERS[side]), -6);
    for (let Lyr = 1; Lyr <= 7; Lyr++) {
      const stage = side === "sp" ? 8 - Lyr : 8 + Lyr;
      out.push(`<path class="osi-hit" data-stage="${stage}" d="${k.slabOf(plan, floorZ(Lyr) - 2, H, P, 2).fill}"><title>Camada ${Lyr}</title></path>`);
    }
  }
  return out.join("");
}

// ---------- roteiro ----------
export const STAGES = [
  { side: "sp", L: 7, name: "Envio", pdu: "dados", title: "Lena toca em enviar", body: "A foto do gato tem 7,68 MB e por enquanto é só dado dentro do app, no topo da pilha. Ela vai descer os 7 andares do celular da Lena, cruzar o planeta e subir os 7 andares do celular do irmão, em Tóquio.", protos: [] },
  { side: "sp", L: 7, name: "Aplicação", pdu: "dados", title: "7 · Aplicação: o app pede para enviar", body: "O app monta uma requisição HTTP (método, URL, headers). Antes disso usou o DNS para descobrir o IP do destino. É a camada que o software enxerga.", protos: ["HTTP", "DNS", "gRPC", "WebSocket", "SSH"] },
  { side: "sp", L: 6, name: "Apresentação", pdu: "dados", title: "6 · Apresentação: comprime e cifra", body: "Formato, compressão e criptografia. A foto é comprimida (7,68 MB → 313 KB) e cifrada com TLS. Por isso o bloco do meio encolhe.", protos: ["TLS", "JPEG", "PNG", "UTF-8"] },
  { side: "sp", L: 5, name: "Sessão", pdu: "dados", title: "5 · Sessão: abre a conversa", body: "Abre, mantém e encerra a conversa entre os dois apps. Se a conexão cair no meio, é aqui que se sabe de onde retomar.", protos: ["sessão TLS", "RPC", "sockets"] },
  { side: "sp", L: 4, name: "Transporte", pdu: "segmento", title: "4 · Transporte: corta em 215 pedaços numerados", body: "O TCP corta os 313 KB em 215 segmentos de ~1.460 bytes, numera cada um, põe porta de origem e destino e reenvia o que se perder. Cabeçalho TCP: 20 bytes.", protos: ["TCP", "UDP"] },
  { side: "sp", L: 3, name: "Rede", pdu: "pacote", title: "3 · Rede: põe o IP de destino", body: "Cada segmento vira um pacote com IP de origem e IP de destino (cabeçalho IPv4 de 20 bytes, IPv6 de 40). É esse rótulo que os roteadores leem no caminho.", protos: ["IPv4", "IPv6", "ICMP"] },
  { side: "sp", L: 2, name: "Enlace", pdu: "quadro", title: "2 · Enlace: o MAC do próximo salto", body: "Para sair de casa, o pacote precisa chegar primeiro ao roteador do Wi-Fi. Ganha o endereço MAC desse próximo salto e um trailer (FCS) que detecta bits corrompidos. Esse endereço só vale até o próximo salto.", protos: ["Wi-Fi 802.11", "Ethernet", "ARP"] },
  { side: "sp", L: 1, name: "Física", pdu: "bits", title: "1 · Física: vira sinal", body: "O quadro vira sinal: ondas de rádio no Wi-Fi, pulsos elétricos no cobre, luz na fibra que cruza o oceano. Aqui não tem envelope, só bits.", protos: ["rádio", "cobre", "fibra óptica"] },
  { side: "x", L: 3, name: "Roteadores", pdu: "bits → pacote → bits", title: "Salto a salto até Tóquio", body: "Cada roteador sobe só até a camada 3: abre o quadro, lê o IP de destino, escolhe o próximo salto e monta um quadro novo, com um MAC novo. O IP de destino não muda no caminho; o MAC muda a cada salto.", protos: ["roteamento", "BGP", "TTL"] },
  { side: "tk", L: 1, name: "Física", pdu: "bits", title: "1 · Física: o sinal chega", body: "A luz da fibra vira sinal elétrico e depois rádio, e o celular do irmão reconstrói os bits do quadro. A volta é a mesma escada, de baixo para cima.", protos: ["fibra óptica", "rádio"] },
  { side: "tk", L: 2, name: "Enlace", pdu: "quadro", title: "2 · Enlace: confere e tira o quadro", body: "Confere o FCS (se veio corrompido, descarta) e vê que o MAC de destino é o dele. Tira o envelope do enlace e entrega o pacote para cima.", protos: ["Wi-Fi 802.11", "Ethernet"] },
  { side: "tk", L: 3, name: "Rede", pdu: "pacote", title: "3 · Rede: o IP é meu", body: "O IP de destino é o dele. Tira o cabeçalho IP e entrega o segmento para o transporte.", protos: ["IPv4", "IPv6"] },
  { side: "tk", L: 4, name: "Transporte", pdu: "segmento", title: "4 · Transporte: põe em ordem e confirma", body: "O TCP coloca os 215 segmentos em ordem, pede de novo os que faltaram e confirma com ACKs. Pela porta de destino sabe para qual app entregar.", protos: ["TCP", "ACK"] },
  { side: "tk", L: 5, name: "Sessão", pdu: "dados", title: "5 · Sessão: a conversa continua", body: "A sessão entre os dois apps segue aberta; os dados continuam subindo pela mesma conversa.", protos: ["sessão TLS"] },
  { side: "tk", L: 6, name: "Apresentação", pdu: "dados", title: "6 · Apresentação: decifra e descomprime", body: "Decifra o TLS e descomprime: os 313 KB voltam a ser uma imagem pronta para exibir. O bloco do meio volta ao tamanho original.", protos: ["TLS", "JPEG"] },
  { side: "tk", L: 7, name: "Aplicação", pdu: "dados", title: "7 · Aplicação: aparece um gato", body: "O app recebe a foto e mostra o gato. Cada camada só conversou com a camada equivalente do outro lado: cada uma pôs um envelope na ida e a mesma camada o tirou na volta.", protos: ["HTTP"] },
];

const TAGS = ["a foto · 7,68 MB", "+ cabeçalho HTTP", "comprime e cifra (+ TLS)", "+ sessão", "+ cabeçalho TCP · 215 pedaços", "+ cabeçalho IP", "+ MAC e FCS", "vira sinal: só bits", "roteador lê o IP", "bits viram quadro", "− MAC (confere o FCS)", "− cabeçalho IP", "− TCP (põe em ordem)", "− sessão", "decifra e descomprime", "foto entregue"];
const LOOKS = [
  "Torre da esquerda (Lena): a tela do celular no topo está acesa e o elevador está no andar 7 só com o bloco branco, a foto, sem nenhum envelope.",
  "O elevador continua no andar 7 e a foto ganhou o primeiro degrau embaixo dela: o cabeçalho HTTP. A lâmpada do andar 7 acendeu.",
  "Andar 6: o bloco branco encolheu (compressão) e entrou mais um degrau, o do TLS.",
  "Andar 5: mais um degrau, o da sessão.",
  "Andar 4: entra o degrau do TCP. A carga já tem 4 envelopes.",
  "Andar 3: entra o degrau do IP. É esse o rótulo que os roteadores vão ler.",
  "Andar 2: entra o degrau mais largo, o quadro de enlace. A pirâmide está completa, com 6 envelopes em volta da foto.",
  "Andar 1: a pirâmide some do elevador, porque daqui em diante ela é só sinal. A luz da caixinha na base da torre acende.",
  "Os pontos brancos correndo no cabo são os bits. Cada roteador acende quando eles passam: ali o quadro é aberto até o IP e refeito.",
  "Torre da direita (irmão), andar 1: a pirâmide inteira reaparece no elevador, reconstruída a partir dos bits.",
  "Andar 2: sai o degrau mais largo, o do enlace.",
  "Andar 3: sai o degrau do IP.",
  "Andar 4: sai o degrau do TCP.",
  "Andar 5: sai o degrau da sessão.",
  "Andar 6: sai o degrau do TLS e o bloco branco volta ao tamanho original.",
  "Andar 7: sai o último degrau, o HTTP. Sobra só a foto, e a tela do celular do irmão acende.",
];
STAGES.forEach((st, i) => { st.tag = TAGS[i]; st.look = LOOKS[i]; });

// o que cada envelope é (índice 1..6 = camadas 7..2), para a pilha "Pacote agora"
const SHELL_INFO = {
  6: { L: 2, name: "Enlace", what: "MAC + FCS", size: "18 B" },
  5: { L: 3, name: "Rede", what: "IP origem → destino", size: "20 B" },
  4: { L: 4, name: "Transporte", what: "TCP: portas + nº", size: "20 B" },
  3: { L: 5, name: "Sessão", what: "a conversa", size: "—" },
  2: { L: 6, name: "Apresentação", what: "TLS", size: "~22 B" },
  1: { L: 7, name: "Aplicação", what: "HTTP", size: "~300 B" },
};

export const FAULTS = {
  1: { title: "Falha na camada 1 · sem sinal", body: "Wi-Fi desligado, cabo solto, fibra rompida. Nada sai do aparelho. Comece olhando a luz do link." },
  2: { title: "Falha na camada 2 · não alcança o roteador", body: "Tem sinal, mas o quadro não chega ao próximo salto: Wi-Fi sem associação, ARP sem resposta, MAC errado." },
  3: { title: "Falha na camada 3 · perdido no caminho", body: "Sai de casa, mas não chega: IP errado, sem gateway, rota quebrada. Ferramentas: ping e traceroute." },
  4: { title: "Falha na camada 4 · faltam pedaços", body: "Chega, mas incompleto ou recusado: perda de pacotes, timeouts, retransmissões, porta fechada." },
  5: { title: "Falha nas camadas 5 a 7 · erro do app", body: "A rede está ok, o problema é mais em cima: sessão expirada, certificado TLS inválido, DNS que não resolve, HTTP 500." },
};

const pct = ([x, y]) => [+(x / WIDTH * 100).toFixed(2), +(y / HEIGHT * 100).toFixed(2)];
const FLOOR_AT = Object.fromEntries(["sp", "tk"].map((side) => {
  const plan = towerPlan(TOWERS[side]);
  return [side, [1, 2, 3, 4, 5, 6, 7].map((Lyr) => pct(at([plan.x + plan.w + 4, plan.y - 2, floorZ(Lyr) + 12])))];
}));
const NAMES = { 1: "Física", 2: "Enlace", 3: "Rede", 4: "Transporte", 5: "Sessão", 6: "Apresentação", 7: "Aplicação" };

// ---------- montagem ----------
export function buildOsiFigure() {
  const order = [
    base(),
    tower("sp"),
    shaft("sp"),
    `<path class="iso-line osi-rope" data-tone="lo" data-rope="sp" d="${ropeAt(TOWERS.sp, floorZ(7))}"/>`,
    `<g class="osi-car" data-car="sp" transform="${k.translateAlong(P, [0, 0, floorZ(7)])}">${car("sp")}</g>`,
    cables(),
    `<g class="osi-bits" data-bits></g>`,
    transceiver("sp"),
    ...ROUTERS.map((x, n) => router(x, n)),
    transceiver("tk"),
    tower("tk"),
    shaft("tk"),
    `<path class="iso-line osi-rope" data-tone="lo" data-rope="tk" d="${ropeAt(TOWERS.tk, floorZ(1))}"/>`,
    `<g class="osi-car" data-car="tk" transform="${k.translateAlong(P, [0, 0, floorZ(1)])}">${car("tk")}</g>`,
    hits(),
  ];

  const svg = k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label:
      "Duas estantes de sete andares representam o celular da Lena e o do irmão. Um monta-carga desce a foto pelos andares 7 a 1 da primeira estante, e cada andar coloca um envelope em volta dela até a carga virar uma pirâmide de degraus. Embaixo ela vira bits num cabo que passa por três roteadores, e na segunda estante sobe do andar 1 ao 7 perdendo um envelope por andar.",
    body: order,
  });

  const stageStrip = STAGES.map((st, i) => {
    const label = i === 0 ? "início" : i === 8 ? "cabo" : String(st.L);
    const group = i === 0 ? "start" : i <= 7 ? "sp" : i === 8 ? "x" : "tk";
    return `<button type="button" class="osi-chip" data-go="${i}" data-group="${group}" aria-label="Passo ${i + 1}: ${st.title}">${label}</button>`;
  }).join("");

  const floorLabels = ["sp", "tk"].map((side) => FLOOR_AT[side].map(([x, y], j) =>
    `<span class="osi-floor" data-floor="${side}-${j + 1}" style="left:${x}%;top:${y}%"><b>${j + 1}</b> ${NAMES[j + 1]}</span>`).join("")).join("");

  const plate = k.plateHtml({
    fig: "Fig 1",
    title: "Uma foto, 7 andares, 2 celulares",
    hint: "Próximo passo ou → no teclado",
    readout: "Passo 1 de 16",
    keys: [
      { mark: "lit", label: "A foto (o dado da aplicação)" },
      { mark: "raised", label: "Envelopes: um por camada, do 7 (topo) ao 2 (base)" },
      { mark: "dotted", label: "Bits no cabo, salto a salto pelos roteadores" },
    ],
    caption: "",
    body: `<div class="iso-stage osi-stage" tabindex="0" role="group" aria-roledescription="figura interativa" aria-label="Modelo OSI: use as setas para avançar e voltar os passos"><div class="osi-canvas">${svg}<div class="osi-overlay" aria-hidden="true">${floorLabels}<span class="osi-tower-name" data-tname="sp" style="left:${pct(at([TOWERS.sp, -40, TOP + 30]))[0]}%;top:${pct(at([TOWERS.sp, -40, TOP + 30]))[1]}%">Lena · São Paulo</span><span class="osi-tower-name" data-tname="tk" style="left:${pct(at([TOWERS.tk, -40, TOP + 30]))[0]}%;top:${pct(at([TOWERS.tk, -40, TOP + 30]))[1]}%">Irmão · Tóquio</span><span class="osi-callout" data-callout><b class="osi-callout-floor" data-callout-floor></b><span data-callout-text></span></span></div></div></div>`,
  });


  const controls = `
<div class="osi-steps">
  <div class="osi-nav">
    <button type="button" class="osi-big" data-act="prev" aria-label="Passo anterior">← Voltar</button>
    <div class="osi-count"><span data-count>Passo 1 de 16</span><span class="osi-bar"><i data-bar></i></span></div>
    <button type="button" class="osi-big is-primary" data-act="next" aria-label="Próximo passo">Próximo passo →</button>
  </div>
  <div class="osi-grid">
    <section class="osi-panel" aria-live="polite">
      <div class="osi-panel-head"><span data-where>São Paulo · celular da Lena</span><span data-pdu>PDU: dados</span></div>
      <h3 data-title>${STAGES[0].title}</h3>
      <p class="osi-look"><span class="osi-eye">No desenho</span><span data-look>${STAGES[0].look}</span></p>
      <p data-body>${STAGES[0].body}</p>
      <div class="osi-protos" data-protos></div>
    </section>
    <section class="osi-data" aria-label="O dado agora">
      <div class="osi-panel-head"><span>O dado agora · como o celular vê</span><span data-dv-step>passo 1</span></div>
      <div class="dv" data-dv></div>
    </section>
  </div>
  <div class="osi-extra">
    <div class="osi-strip" role="toolbar" aria-label="Ir para um passo"><span class="osi-strip-label">Lena ↓</span>${stageStrip.replace('data-go="9"', 'data-go="9" data-break').replace(/(<button[^>]*data-go="9"[^>]*>)/, '<span class="osi-strip-label">Irmão ↑</span>$1')}</div>
    <div class="osi-tools">
      <button type="button" class="osi-btn" data-act="play" aria-pressed="false">▶ Tocar sozinho</button>
      <label class="osi-fault">Simular falha em
        <select data-fault>
          <option value="0">nenhuma camada</option>
          <option value="1">1 · Física</option>
          <option value="2">2 · Enlace</option>
          <option value="3">3 · Rede</option>
          <option value="4">4 · Transporte</option>
          <option value="5">5–7 · Sessão / Apresentação / Aplicação</option>
        </select>
      </label>
    </div>
  </div>
</div>`;

  const html = `<div class="iso osi-figure" data-theme="dark">${plate}${controls}</div>`;

  const css = `
.osi-figure{background:transparent}
.osi-figure .iso-figure{margin:0}
.osi-figure .iso-legend{margin-top:10px}
.osi-stage{outline:none;position:relative}
.osi-stage:focus-visible{box-shadow:0 0 0 2px var(--anatomy-mid);border-radius:12px}
.osi-canvas{position:relative}
.osi-canvas svg{display:block;width:100%;height:auto}
.osi-overlay{position:absolute;inset:0;pointer-events:none;font-family:var(--anatomy-mono)}
.osi-floor{position:absolute;transform:translate(4px,-50%);white-space:nowrap;font-size:11px;line-height:1;color:var(--anatomy-muted);opacity:0;transition:opacity .3s,color .3s;padding:3px 6px 3px 10px;border-left:1px solid var(--anatomy-lo)}
.osi-floor b{color:var(--anatomy-text)}
.osi-floor.is-tower{opacity:.75}
.osi-floor.is-here{opacity:1;color:var(--anatomy-strong);font-weight:700;border-left:2px solid var(--anatomy-strong);background:var(--anatomy-card);border-radius:0 6px 6px 0}
.osi-floor.is-here b{color:var(--anatomy-strong)}
.osi-tower-name{position:absolute;transform:translate(-50%,-100%);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted);white-space:nowrap}
.osi-callout{position:absolute;left:0;top:0;transform:translate(-50%,calc(-100% - 10px));background:var(--anatomy-strong);color:var(--anatomy-card);font:700 12px/1.2 var(--anatomy-mono);padding:6px 10px;border-radius:8px;white-space:nowrap;transition:opacity .25s;box-shadow:0 4px 14px #0004}
.osi-callout-floor{display:none}
.osi-callout::after{content:"";position:absolute;left:calc(50% + var(--tip,0px));bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:var(--anatomy-strong)}
.osi-figure.is-fault .osi-callout{background:var(--anatomy-red)}
.osi-figure.is-fault .osi-callout::after{border-top-color:var(--anatomy-red)}
.osi-hit{fill:transparent;stroke:none;cursor:pointer}
.osi-hit:hover{fill:var(--anatomy-lit);fill-opacity:.035}
.osi-figure .osi-lamp .iso-dots circle{opacity:.18;transition:opacity .35s var(--anatomy-ease),fill .35s}
.osi-figure .osi-lamp.is-on .iso-dots circle{opacity:1;fill:var(--anatomy-lit)}
.osi-figure .osi-lamp.is-bad .iso-dots circle{opacity:1;fill:var(--anatomy-red);animation:osi-blink 1s steps(1,end) infinite}
@keyframes osi-blink{50%{opacity:.25}}
.osi-screen{opacity:0;transition:opacity .6s var(--anatomy-ease)}
.osi-screen.is-on{opacity:1}
.osi-figure .osi-bits circle{fill:var(--anatomy-lit)}
.osi-figure.is-fault [data-car="sp"] .osi-shell .iso-edge,.osi-figure.is-fault [data-car="sp"] .osi-core .iso-edge{stroke:var(--anatomy-red);animation:osi-blink 1s steps(1,end) infinite}
.osi-steps{margin-top:14px;display:grid;gap:12px}
.osi-nav{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}
.osi-big{font:700 15px/1 var(--anatomy-mono);padding:14px 18px;border-radius:12px;border:1px solid var(--anatomy-lo);background:var(--anatomy-card);color:var(--anatomy-strong);cursor:pointer;min-height:48px}
.osi-big.is-primary{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.osi-big:hover{border-color:var(--anatomy-mid)}
.osi-big:disabled{opacity:.35;cursor:default}
.osi-count{display:grid;gap:6px;font:600 13px/1 var(--anatomy-mono);color:var(--anatomy-text);text-align:center}
.osi-bar{display:block;height:6px;border-radius:99px;background:var(--anatomy-faint);overflow:hidden}
.osi-bar i{display:block;height:100%;width:0;background:var(--anatomy-strong);border-radius:99px;transition:width .35s var(--anatomy-ease)}
.osi-grid{display:grid;grid-template-columns:1fr;gap:12px}
.osi-panel,.osi-data{background:var(--anatomy-card);border-radius:14px;padding:16px 18px;box-shadow:var(--anatomy-lift)}
.osi-panel-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font:11px/1.4 var(--anatomy-mono);color:var(--anatomy-muted);text-transform:uppercase;letter-spacing:.06em}
.osi-panel h3{margin:8px 0 10px;font-size:19px;line-height:1.3;color:var(--anatomy-strong)}
.osi-panel p{margin:0 0 10px;color:var(--anatomy-text);font-size:16px;line-height:1.65}
.osi-look{display:grid;gap:4px;padding:10px 12px;border-radius:10px;border:1px solid var(--anatomy-lo);background:var(--anatomy-page)}
.osi-look span:last-child{color:var(--anatomy-strong)}
.osi-eye{font:700 11px/1.2 var(--anatomy-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted)}
.osi-panel.is-bad h3{color:var(--anatomy-red)}
.osi-protos{display:flex;flex-wrap:wrap;gap:6px}
.osi-protos span{font:11px/1 var(--anatomy-mono);padding:5px 8px;border-radius:999px;border:1px solid var(--anatomy-lo);color:var(--anatomy-text)}
.osi-extra{display:grid;gap:10px}
.osi-strip{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.osi-strip-label{font:11px/1 var(--anatomy-mono);color:var(--anatomy-muted);margin:0 4px 0 2px}
.osi-strip-label:not(:first-child){margin-left:10px}
.osi-btn,.osi-chip{font:600 12px/1 var(--anatomy-mono);color:var(--anatomy-text);background:var(--anatomy-card);border:1px solid var(--anatomy-lo);border-radius:8px;cursor:pointer}
.osi-chip{min-width:28px;height:28px;padding:0 7px}
.osi-btn{height:32px;padding:0 12px;color:var(--anatomy-strong)}
.osi-chip.is-here{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.osi-chip.is-seen{border-color:var(--anatomy-mid)}
.osi-chip.is-bad{border-color:var(--anatomy-red);color:var(--anatomy-red)}
.osi-btn:hover,.osi-chip:hover{border-color:var(--anatomy-mid)}
.osi-big:focus-visible,.osi-btn:focus-visible,.osi-chip:focus-visible,.osi-fault select:focus-visible{outline:2px solid var(--anatomy-mid);outline-offset:2px}
.osi-tools{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.osi-fault{font:12px/1.4 var(--anatomy-mono);color:var(--anatomy-muted);display:flex;gap:8px;align-items:center}
.osi-fault select{font:inherit;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-lo);border-radius:8px;padding:6px 8px;min-width:0;max-width:100%}
.dv{margin-top:12px;display:grid;gap:12px}
.dv-cap{margin:0;color:var(--anatomy-text);font-size:15px;line-height:1.6}
.dv-cap b{color:var(--anatomy-strong)}
.dv-cap code{font:12px var(--anatomy-mono);color:var(--anatomy-strong)}
.dv-bad{color:var(--anatomy-red)}
.dv-row{display:flex;flex-wrap:wrap;gap:4px;align-items:stretch}
.dv-box{position:relative;flex:0 0 auto;min-width:96px;display:grid;align-content:start;gap:2px;padding:20px 9px 8px;border-radius:8px;border:1px solid var(--anatomy-lo);background:var(--anatomy-face);font:11px/1.35 var(--anatomy-mono);color:var(--anatomy-text)}
.dv-box b{color:var(--anatomy-strong);font-size:12px}
.dv-box small{font-size:10.5px;color:var(--anatomy-text);white-space:nowrap}
.dv-box small span{color:var(--anatomy-muted)}
.dv-box em{font-style:normal;color:var(--anatomy-muted);font-size:10px;margin-top:2px}
.dv-l{position:absolute;top:5px;left:8px;font:700 10px/1 var(--anatomy-mono);color:var(--anatomy-muted)}
.dv-l::before{content:"camada "}
.dv-pay{flex:1 1 140px;min-width:140px;border-style:dashed}
.dv-pay .dv-mono{white-space:normal;word-break:break-all;color:var(--anatomy-muted)}
.dv-note{font-style:normal;font-weight:700;font-size:10.5px;color:var(--anatomy-strong);margin-top:4px}
.dv-box.is-new{border-color:var(--anatomy-strong);box-shadow:0 0 0 1px var(--anatomy-strong);animation:dv-in .55s var(--anatomy-ease) both}
.dv-box.is-new .dv-l::after{content:" · entrou";color:var(--anatomy-strong)}
.dv-box.is-out{opacity:.55;border-style:dashed;animation:dv-out .6s var(--anatomy-ease) both}
.dv-box.is-out b{text-decoration:line-through}
.dv-box.is-out .dv-l::after{content:" · sai";color:var(--anatomy-strong)}
.dv-box.is-ok{border-color:var(--anatomy-mid)}
@keyframes dv-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
@keyframes dv-out{from{opacity:1}to{opacity:.55}}
.dv-text{margin:0;padding:12px 14px;border-radius:10px;border:1px solid var(--anatomy-lo);background:var(--anatomy-face);font:12px/1.55 var(--anatomy-mono);color:var(--anatomy-text);white-space:pre-wrap;word-break:break-word}
.dv-text.is-new{border-color:var(--anatomy-strong);animation:dv-in .55s var(--anatomy-ease) both}
.dv-hl{color:var(--anatomy-strong)}
.dv-dim{color:var(--anatomy-muted)}
.dv-photo{display:flex;gap:14px;align-items:center;padding:12px 14px;border-radius:10px;border:1px solid var(--anatomy-strong);background:var(--anatomy-face);font:12px/1.4 var(--anatomy-mono)}
.dv-photo b{display:block;color:var(--anatomy-strong);font-size:14px}
.dv-photo small{color:var(--anatomy-muted)}
.dv-photo.is-new{animation:dv-in .6s var(--anatomy-ease) both}
.dv-cat{fill:var(--anatomy-strong);flex:none}
.dv-sizes{display:grid;gap:6px}
.dv-size{display:grid;grid-template-columns:90px 1fr 64px;gap:8px;align-items:center;font:11px var(--anatomy-mono);color:var(--anatomy-muted)}
.dv-size i{height:10px;border-radius:99px;background:var(--anatomy-mid);transition:width .9s var(--anatomy-ease)}
.dv-size.is-on i{background:var(--anatomy-strong)}
.dv-size b{color:var(--anatomy-strong);text-align:right}
.dv-badge{justify-self:start;font:700 12px/1 var(--anatomy-mono);padding:8px 12px;border-radius:999px;border:1px solid var(--anatomy-strong);color:var(--anatomy-strong)}
.dv-badge.is-new{animation:dv-in .55s var(--anatomy-ease) both}
.dv-badge.is-out{opacity:.6;border-style:dashed}
.dv-slices{display:grid;grid-template-columns:repeat(43,1fr);gap:2px}
.dv-slices i{height:9px;border-radius:2px;background:var(--anatomy-lo)}
.dv-slices i.is-first{background:var(--anatomy-strong)}
.dv-slices i.is-ok{background:var(--anatomy-mid)}
.dv-bits{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:12px var(--anatomy-mono);color:var(--anatomy-muted)}
.dv-bits code{color:var(--anatomy-strong);font:inherit}
.dv-wave{width:100%;height:44px;fill:none;stroke:var(--anatomy-strong);stroke-width:1.6;vector-effect:non-scaling-stroke}
.dv-media{display:flex;flex-wrap:wrap;gap:6px}
.dv-media span{font:11px/1 var(--anatomy-mono);padding:5px 8px;border-radius:999px;border:1px solid var(--anatomy-lo);color:var(--anatomy-text)}
@media (prefers-reduced-motion:reduce){.dv-box,.dv-text,.dv-photo,.dv-badge{animation:none!important}}
@media (max-width:560px){
  .dv-slices{grid-template-columns:repeat(27,1fr)}
  .osi-figure .iso-plate{overflow:hidden}
  .osi-canvas{width:132%;margin:-9% -16% -7%}
  .osi-floor{display:none}
  .osi-callout-floor{display:inline}
  .osi-figure .iso-plate-corner[data-corner="fig"],.osi-figure .iso-plate-corner[data-corner="title"]{display:none}
  .osi-tower-name{font-size:9px}
  .osi-callout{font-size:11px;padding:5px 8px}
  .osi-nav{grid-template-columns:1fr 1fr}
  .osi-count{grid-column:1/-1;grid-row:1}
  .osi-big{font-size:14px;padding:12px}
  .osi-fault{width:100%;flex-wrap:wrap}.osi-fault select{flex:1 1 100%}
}
@media (prefers-reduced-motion:reduce){.dv *,.osi-bar i,.osi-floor,.osi-callout{transition:none}}
`;

  const live = `
const OSI = (() => {
${DATA_SRC}
const P = ${JSON.stringify(P)};
const STAGES = ${JSON.stringify(STAGES)};
const FAULTS = ${JSON.stringify(FAULTS)};
const SHELL_INFO = ${JSON.stringify(SHELL_INFO)};
const TOWERS = ${JSON.stringify(TOWERS)};
const floorZ = (L) => ${PLINTH} + (L - 1) * ${H};
const SHAFT_TOP = ${ROPE_TOP}, POST_Y = ${POST_Y}, PAY_Y = ${PAY_Y}, SHELL_T = ${SHELL_T}, CORE = ${JSON.stringify(CORE)}, SQUEEZE = ${SQUEEZE};
const CABLE_Y = ${CABLE_Y}, ROUTERS = ${JSON.stringify(ROUTERS)}, CLIPS = ${JSON.stringify(CLIPS)};
const X0 = ${XCVR.sp.x + XCVR.sp.w / 2}, X1 = ${XCVR.tk.x + XCVR.tk.w / 2};
const root = document.querySelector(".osi-figure");
const stage = root.querySelector(".osi-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (s) => svg.querySelector(s);
const cars = { sp: $('[data-car="sp"]'), tk: $('[data-car="tk"]') };
const ropes = { sp: $('[data-rope="sp"]'), tk: $('[data-rope="tk"]') };
const shells = { sp: [], tk: [] };
for (const side of ["sp", "tk"]) for (let i = 1; i <= 6; i++) shells[side][i] = $('[data-side="' + side + '"][data-shell="' + i + '"]');
const cores = { sp: $('.osi-core[data-side="sp"]'), tk: $('.osi-core[data-side="tk"]') };
const lamps = [...svg.querySelectorAll("[data-lamp]")];
const lamp = (id) => svg.querySelector('[data-lamp="' + id + '"]');
const screens = { sp: $('[data-screen="sp"]'), tk: $('[data-screen="tk"]') };
const bitsG = $("[data-bits]");
const panel = root.querySelector(".osi-panel");
const q = (sel) => root.querySelector(sel);
const ui = { where: q("[data-where]"), pdu: q("[data-pdu]"), title: q("[data-title]"), body: q("[data-body]"), protos: q("[data-protos]"), look: q("[data-look]"), count: q("[data-count]"), bar: q("[data-bar]") };
const dataEl = q("[data-dv]");
const floors = [...root.querySelectorAll(".osi-floor")];
const canvas = q(".osi-canvas"), plateEl = q(".iso-plate");
const callout = q("[data-callout]"), calloutText = q("[data-callout-text]");
const prevBtn = q('[data-act="prev"]'), nextBtn = q('[data-act="next"]');
const seen = new Set([0]);
const chips = [...root.querySelectorAll(".osi-chip")];
const playBtn = root.querySelector('[data-act="play"]');
const faultSel = root.querySelector("[data-fault]");

// alvo de cada etapa: altura dos carros, envelopes presentes, alfa da carga, fator de compressão
function goal(s) {
  const g = { z: { sp: floorZ(1), tk: floorZ(1) }, have: { sp: [0,0,0,0,0,0,0], tk: [0,0,0,0,0,0,0] }, alpha: { sp: 0, tk: 0 }, f: { sp: 1, tk: SQUEEZE } };
  if (s <= 7) {
    const L = s === 0 ? 7 : 8 - s;
    g.z.sp = floorZ(L);
    for (let i = 1; i <= 6; i++) g.have.sp[i] = s >= 1 && 8 - i >= L ? 1 : 0;
    g.alpha.sp = s === 7 ? 0 : 1;
    g.f.sp = s >= 2 ? SQUEEZE : 1;
  } else {
    g.z.sp = floorZ(1);
  }
  if (s >= 9) {
    const L = s - 8;
    g.z.tk = floorZ(L);
    for (let i = 1; i <= 6; i++) g.have.tk[i] = 8 - i > L ? 1 : 0;
    g.alpha.tk = 1;
    g.f.tk = L >= 6 ? 1 : SQUEEZE;
  }
  return g;
}

const cur = goal(0);
let s = 0, playing = false, fault = 0, halted = false, dwell = 0, bitsT = -1, frame = 0, last = 0, visible = false;
const DWELL = (i) => (i === 8 ? 6 : 6.5); // tempo de leitura por passo no modo automático

function setLamps() {
  for (const el of lamps) el.classList.remove("is-on", "is-bad");
  const st = STAGES[s];
  if (halted) { lamp("sp-" + (fault >= 5 ? 7 : fault))?.classList.add("is-bad"); return; }
  if (st.side === "sp" && s > 0) lamp("sp-" + st.L)?.classList.add("is-on");
  if (st.side === "tk") lamp("tk-" + st.L)?.classList.add("is-on");
  if (s === 7) lamp("x-sp")?.classList.add("is-on");
  if (s === 9) lamp("x-tk")?.classList.add("is-on");
}

function describe() {
  const st = STAGES[s];
  const where = st.side === "sp" ? "São Paulo · celular da Lena" : st.side === "tk" ? "Tóquio · celular do irmão" : "No caminho · roteadores e fibra";
  let title = st.title, body = st.body, protos = st.protos;
  panel.classList.toggle("is-bad", halted);
  root.classList.toggle("is-fault", halted);
  if (halted) { title = FAULTS[fault].title; body = FAULTS[fault].body; protos = []; }
  ui.where.textContent = where;
  ui.pdu.textContent = "PDU: " + st.pdu;
  ui.title.textContent = title;
  ui.body.textContent = body;
  ui.protos.innerHTML = protos.map((p) => "<span>" + p + "</span>").join("");
  ui.look.textContent = halted ? "O elevador parou neste andar e a carga ficou vermelha: é aqui que a viagem quebrou." : st.look;
  calloutText.textContent = halted ? "falhou aqui" : st.tag;
  q("[data-callout-floor]").textContent = s === 8 ? "" : "andar " + st.L + " · ";
  ui.count.textContent = "Passo " + (s + 1) + " de " + STAGES.length;
  ui.bar.style.width = ((s + 1) / STAGES.length * 100).toFixed(1) + "%";
  prevBtn.disabled = s === 0;
  nextBtn.textContent = s === STAGES.length - 1 ? "Recomeçar ↺" : "Próximo passo →";
  seen.add(s);
  // "o dado agora": o conteúdo real do dado neste passo
  dataEl.innerHTML = osiDataView(s, halted);
  q("[data-dv-step]").textContent = "passo " + (s + 1) + " de " + STAGES.length;
  // nomes dos andares: só os da torre ativa, com destaque no andar atual
  for (const el of floors) {
    const [fs, fl] = el.dataset.floor.split("-");
    const tower = st.side === fs || (st.side === "x" && false);
    el.classList.toggle("is-tower", tower);
    el.classList.toggle("is-here", tower && +fl === st.L && s !== 8);
  }
  const who = st.side === "sp" ? "Lena" : st.side === "tk" ? "Irmão" : "Caminho";
  const text = halted ? "Falha · camada " + (fault >= 5 ? "5–7" : fault) : "Passo " + (s + 1) + " de " + STAGES.length + " · " + (s === 0 ? "início" : s === 8 ? "roteadores" : who + " · " + st.L + " " + st.name);
  readout.textContent = text;
  chips.forEach((c, i) => { c.classList.toggle("is-seen", seen.has(i)); c.classList.toggle("is-here", i === s); c.classList.toggle("is-bad", halted && i === s); c.setAttribute("aria-current", i === s ? "step" : "false"); });
  screens.sp.classList.toggle("is-on", s === 0);
  screens.tk.classList.toggle("is-on", s === 15);
  setLamps();
}

const faultStage = () => (fault >= 5 ? 1 : 8 - fault);
function go(i, user) {
  i = (i + STAGES.length) % STAGES.length;
  if (user) halted = false;
  if (fault && !user && s === faultStage() && i === s + 1) { halted = true; }
  else s = i;
  if (fault && user && i === faultStage()) halted = true;
  dwell = 0;
  bitsT = s === 8 && !halted ? 0 : -1;
  if (s === 0) { cur.have.tk = [0,0,0,0,0,0,0]; cur.alpha.tk = 0; }
  describe();
  run();
}

function follow(a, b, dt, tau) { return still.matches ? b : a + (b - a) * (1 - Math.exp(-dt / tau)); }

function drawBits() {
  if (bitsT < 0) { if (bitsG.firstChild) bitsG.innerHTML = ""; lamp("r-0")?.classList.remove("is-on"); lamp("r-1")?.classList.remove("is-on"); lamp("r-2")?.classList.remove("is-on"); return; }
  const span = X1 - X0, n = 9, gap = 7, speed = (span + n * gap) / 4.4;
  const head = X0 + bitsT * speed;
  bitsHead = head;
  const pts = [];
  for (let j = 0; j < n; j++) {
    const x = head - j * gap;
    if (x < X0 + 9 || x > X1 - 9) continue;
    if (ROUTERS.some((r) => Math.abs(x - r) < 10) || CLIPS.some((c) => Math.abs(x - c) < 2.6)) continue;
    pts.push(iso([x, CABLE_Y, 3.4], P));
  }
  bitsG.innerHTML = pts.map(([x, y]) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.25"/>').join("");
  ROUTERS.forEach((r, n2) => lamp("r-" + n2)?.classList.toggle("is-on", head > r - 10 && head - (n - 1) * gap < r + 10));
}

function draw() {
  for (const side of ["sp", "tk"]) {
    const z = cur.z[side];
    cars[side].setAttribute("transform", translateAlong(P, [0, 0, z]));
    ropes[side].setAttribute("d", segment([TOWERS[side], POST_Y, SHAFT_TOP], [TOWERS[side], POST_Y, z], P));
    let lift = 0;
    for (let i = 6; i >= 1; i--) {
      const h = cur.have[side][i];
      const el = shells[side][i];
      el.setAttribute("transform", translateAlong(P, [0, 0, lift - (1 - h) * SHELL_T]));
      el.style.opacity = (h * cur.alpha[side]).toFixed(3);
      el.style.display = h * cur.alpha[side] < 0.01 ? "none" : "";
      lift += h * SHELL_T;
    }
    cores[side].setAttribute("transform", translateAlong(P, [0, 0, lift]));
    cores[side].style.opacity = cur.alpha[side].toFixed(3);
    const f = cur.f[side];
    if (cores[side].dataset.f !== f.toFixed(3)) {
      cores[side].dataset.f = f.toFixed(3);
      const w = CORE.w * f, h = CORE.h * (0.55 + 0.45 * f), cx = TOWERS[side];
      const plan = { x: cx - w / 2, y: PAY_Y - w / 2, w, d: w, r: 1 };
      cores[side].innerHTML = solidSvg(slabOf(plan, 0, h, P, 3, 0.4), { tone: "hi", lit: true }) + lineSvg(planOutline(insetPlan(plan, 1.6), h, P, 2), { tone: "lo" });
    }
  }
  drawBits();
  placeCallout();
}

let bitsHead = X0;
function placeCallout() {
  let p;
  if (s === 8 && !halted) p = iso([Math.min(Math.max(bitsHead, X0), X1), CABLE_Y, 16], P);
  else {
    const side = STAGES[s].side === "tk" ? "tk" : "sp";
    let lift = 0;
    for (let i = 1; i <= 6; i++) lift += cur.have[side][i] * SHELL_T;
    p = iso([TOWERS[side], PAY_Y, cur.z[side] + lift + CORE.h + 3], P);
  }
  // mantém o balão dentro da parte visível do cartão (no celular o desenho é ampliado e cortado)
  const cv = canvas.getBoundingClientRect(), pl = plateEl.getBoundingClientRect();
  const half = callout.offsetWidth / 2 + 6;
  let x = cv.left + (p[0] / ${WIDTH}) * cv.width;
  x = Math.min(Math.max(x, pl.left + half), pl.right - half);
  callout.style.left = (((x - cv.left) / cv.width) * 100).toFixed(2) + "%";
  callout.style.top = (p[1] / ${HEIGHT} * 100).toFixed(2) + "%";
  callout.style.setProperty("--tip", (((cv.left + (p[0] / ${WIDTH}) * cv.width) - x)).toFixed(1) + "px");
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const g = goal(s);
  let moving = false;
  for (const side of ["sp", "tk"]) {
    const before = cur.z[side];
    cur.z[side] = follow(cur.z[side], g.z[side], dt, 0.42);
    if (Math.abs(cur.z[side] - g.z[side]) < 0.02) cur.z[side] = g.z[side];
    const arrived = Math.abs(cur.z[side] - g.z[side]) < 1.5;
    for (let i = 1; i <= 6; i++) {
      const want = arrived ? g.have[side][i] : cur.have[side][i] > 0.5 ? 1 : 0;
      cur.have[side][i] = follow(cur.have[side][i], want === undefined ? 0 : want, dt, 0.3);
      if (Math.abs(cur.have[side][i] - want) < 0.002) cur.have[side][i] = want;
      if (cur.have[side][i] !== want) moving = true;
    }
    cur.alpha[side] = follow(cur.alpha[side], g.alpha[side], dt, 0.45);
    if (Math.abs(cur.alpha[side] - g.alpha[side]) < 0.003) cur.alpha[side] = g.alpha[side];
    cur.f[side] = arrived ? follow(cur.f[side], g.f[side], dt, 0.35) : cur.f[side];
    if (Math.abs(cur.f[side] - g.f[side]) < 0.002) cur.f[side] = g.f[side];
    if (cur.z[side] !== before || cur.alpha[side] !== g.alpha[side] || cur.f[side] !== g.f[side]) moving = true;
  }
  if (bitsT >= 0) { bitsT += dt; moving = true; if (bitsT > 4.6) bitsT = -1; }
  draw();
  if (playing && !halted) { dwell += dt; if (dwell >= DWELL(s)) go(s + 1, false); }
  frame = visible && (moving || (playing && !halted)) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
function setPlaying(on) { playing = on; playBtn.textContent = on ? "❚❚ Pausar" : "▶ Tocar sozinho"; playBtn.setAttribute("aria-pressed", String(on)); if (on && halted) { halted = false; go(0, true); } run(); }

prevBtn.addEventListener("click", () => { setPlaying(false); if (s > 0) go(s - 1, true); });
nextBtn.addEventListener("click", () => { setPlaying(false); go(s + 1, true); });
playBtn.addEventListener("click", () => setPlaying(!playing));
chips.forEach((c) => c.addEventListener("click", () => { setPlaying(false); go(+c.dataset.go, true); }));
svg.querySelectorAll(".osi-hit").forEach((h) => h.addEventListener("click", () => { setPlaying(false); go(+h.dataset.stage, true); }));
faultSel.addEventListener("change", () => { fault = +faultSel.value; halted = false; go(0, true); setPlaying(true); });
stage.addEventListener("keydown", (e) => {
  let to = null;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") to = s + 1;
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = s - 1;
  if (e.key === "Home") to = 0;
  if (e.key === "End") to = STAGES.length - 1;
  if (e.key === " ") { e.preventDefault(); setPlaying(!playing); return; }
  if (to === null) return;
  e.preventDefault(); setPlaying(false); go(to, true);
});
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const theme = () => root.setAttribute("data-theme", (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")));
theme(); matchMedia("(prefers-color-scheme: light)").addEventListener("change", theme);
setPlaying(playing);
describe(); draw();
return { go, setPlaying };
})();
`;

  return { css: k.ISO_CSS + css, html, script: KIT_SRC + "\n" + live };
}

// ---------- página de teste ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const theme = process.argv.includes("--light") ? "light" : "dark";
  const { css, html, script } = buildOsiFigure();
  const page = `<!doctype html><html lang="pt-BR" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fig OSI</title>
<style>*{box-sizing:border-box}body{margin:0;background:${theme === "light" ? "#f2f2ef" : "#0b0b0b"};font:14px/1.6 system-ui,sans-serif}main{width:min(860px,100% - 32px);margin:40px auto}${css}</style></head>
<body><main>${html}</main><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;
  const out = join(HERE, theme === "light" ? "osi-figure-light.html" : "osi-figure.html");
  writeFileSync(out, page);
  console.log("wrote", out);
}
