// Gera public/labs/protocolos-de-rede/osi-3d/index.html: modelo 3D do iso-glow + figura OSI (fig3d.js)
// + roteiro e painel "O dado agora". Roda antes do astro build (npm run build:3d).
//   node src/figures/osi-3d/build.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STAGES } from "../osi/osi-figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(HERE, p), "utf8");
let s = read("../../../tools/iso-glow/gallery-3d.html");
const stages = STAGES.map(({ side, L, name, pdu, title, body, protos, tag, look }) => ({ side, L, name, pdu, title, body, protos, tag, look }));

const css = `
#info{pointer-events:auto;max-width:min(470px,calc(100vw - 230px));max-height:calc(100vh - 150px);overflow:auto;bottom:44px;font:13px/1.55 ui-sans-serif,system-ui,sans-serif;
  --anatomy-strong:var(--ink);--anatomy-text:var(--ink);--anatomy-muted:var(--dim);--anatomy-lo:var(--line);--anatomy-mid:var(--dim);--anatomy-faint:var(--line);
  --anatomy-face:var(--bg);--anatomy-card:var(--panel);--anatomy-page:var(--bg);--anatomy-red:#ff6b6b;--anatomy-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--anatomy-ease:cubic-bezier(.32,.72,0,1)}
#info h2{font-size:14px;letter-spacing:.02em;text-transform:none;margin:8px 0 8px}
#info p{margin:0 0 8px}
.o3-head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font:11px/1.4 ui-monospace,monospace;color:var(--dim);text-transform:uppercase;letter-spacing:.05em}
.o3-bar{height:4px;border-radius:9px;background:var(--line);margin-top:6px;overflow:hidden}.o3-bar i{display:block;height:100%;background:var(--accent)}
.o3-look{display:grid;gap:2px;padding:8px 10px;border:1px solid var(--line);border-radius:8px}
.o3-look b{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.o3-dv summary{cursor:pointer;font:600 11px/1.4 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin:4px 0}
.o3-dv .dv{margin-top:6px}.o3-dv .dv-cap{font-size:13px}.o3-dv .dv-box{min-width:84px}
.o3-mode{display:flex;gap:6px;margin:10px 0 2px}.o3-mode button{all:unset;cursor:pointer;flex:1;text-align:center;padding:7px 8px;border:1px solid var(--line);border-radius:8px;font:600 11.5px ui-monospace,monospace;color:var(--dim)}.o3-mode button[aria-pressed="true"]{color:var(--ink);border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}.o3-mode button:focus-visible{outline:2px solid var(--accent)}
.o3-story{font-size:14px;line-height:1.6;color:var(--ink)}
.o3-key{display:grid;gap:2px;padding:8px 10px;border:1px solid var(--line);background:rgba(127,127,127,.06);border-radius:8px}.o3-key b{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.o3-dv .dv-cap{display:none}
.o3-back{position:fixed;left:16px;top:58px;z-index:5;font:12px ui-monospace,monospace;color:var(--dim);text-decoration:none;pointer-events:auto}
.o3-back:hover{color:var(--ink)}
.embedded .o3-back{display:none}
.embedded #info{left:8px;right:8px;max-width:none;bottom:8px;max-height:40vh;font-size:13px}
.embedded #swatches,.embedded #read,.embedded #hint,.embedded #credit{display:none!important}
.embedded .o3-back{top:52px}
.embedded #ctl-osi{top:auto!important;bottom:calc(40vh + 18px)!important;left:8px!important;right:8px!important;width:auto!important;flex-direction:row!important;gap:8px!important}
.embedded #ctl-osi button{flex:1;justify-content:center;text-align:center}
.embedded #ctl-osi button:nth-child(2){order:-1}
.embedded #ctl-osi button:nth-child(n+3),.embedded #ctl-osi .sep{display:none!important}

@media (max-width:900px){
  #info{left:8px;right:8px;max-width:none;bottom:8px;max-height:40vh;font-size:13px}
  #swatches,#read,#hint,#credit{display:none!important}
  .o3-back{top:52px}
  #ctl-osi{top:auto!important;bottom:calc(40vh + 18px)!important;left:8px!important;right:8px!important;width:auto!important;flex-direction:row!important;gap:8px!important}
  #ctl-osi button{flex:1;justify-content:center;text-align:center}
  #ctl-osi button:nth-child(2){order:-1}
  #ctl-osi button:nth-child(n+3),#ctl-osi .sep{display:none!important}

}
${read("../osi/osi-data.css")}
`;
const reps = [
  ["<title>Iso 3D</title>", "<title>Modelo OSI em 3D · SDLabs</title>"],
  ["<i></i>Iso 3D</div>", "<i></i>Modelo OSI · 3D</div>"],
  ["</style>", css + "</style>"],
  ["</head>", "<script>if (new URLSearchParams(location.search).has(\"embed\")) document.documentElement.classList.add(\"embedded\");</script></head>"],
  ['<div class="ui" id="info">', '<a class="o3-back" href="../#aula-2-modelo-osi">Voltar ao módulo</a>\n<div class="ui" id="info">'],
  ["/* paste 3D figure modules here */", `const OSI_STAGES = ${JSON.stringify(stages)};\n${read("../osi/osi-data.js")}\n${read("fig3d.js")}`],
];
for (const [a, b] of reps) { if (!s.includes(a)) throw new Error("não achei: " + a); s = s.replace(a, b); }
s = s.replace('<html lang="en">', '<html lang="pt-BR">');
const OUT = join(HERE, "../../../public/labs/protocolos-de-rede/osi-3d");
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), s);
console.log("wrote", join(OUT, "index.html"), (s.length / 1024).toFixed(0) + " KB");
