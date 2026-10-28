// Gera public/labs/storage-raid-io/raid-3d/index.html: modelo 3D do iso-glow + figura RAID (fig3d.js) + painel do roteiro.
//   node src/figures/raid-3d/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(HERE, p), "utf8");
let s = read("../../../tools/iso-glow/gallery-3d.html");

const css = `
#info{pointer-events:auto;max-width:min(470px,calc(100vw - 230px));max-height:calc(100vh - 150px);overflow:auto;bottom:44px;font:13px/1.55 ui-sans-serif,system-ui,sans-serif}
#info h2{font-size:14px;letter-spacing:.02em;text-transform:none;margin:8px 0 8px}
#info p{margin:0 0 8px}
.o3-head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font:11px/1.4 ui-monospace,monospace;color:var(--dim);text-transform:uppercase;letter-spacing:.05em}
.o3-bar{height:4px;border-radius:9px;background:var(--line);margin-top:6px;overflow:hidden}.o3-bar i{display:block;height:100%;background:var(--accent)}
.o3-look{display:grid;gap:2px;padding:8px 10px;border:1px solid var(--line);border-radius:8px}
.o3-look b{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.o3-dv summary{cursor:pointer;font:600 11px/1.4 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin:4px 0}
.o3-mode{display:flex;gap:6px;margin:10px 0 2px}.o3-mode button{all:unset;cursor:pointer;flex:1;text-align:center;padding:7px 8px;border:1px solid var(--line);border-radius:8px;font:600 11.5px ui-monospace,monospace;color:var(--dim)}.o3-mode button[aria-pressed="true"]{color:var(--ink);border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}.o3-mode button:focus-visible{outline:2px solid var(--accent)}
.o3-story{font-size:14px;line-height:1.6;color:var(--ink)}
.o3-key{display:grid;gap:2px;padding:8px 10px;border:1px solid var(--line);background:rgba(127,127,127,.06);border-radius:8px}.o3-key b{font:600 10.5px/1.2 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.h3-now{margin:4px 0 0;padding-left:18px;font:12px/1.6 ui-monospace,monospace;color:var(--dim)}.h3-now b{color:var(--ink);font-weight:600}.h3-dim{color:var(--dim)}
.h3-sum{width:100%;border-collapse:collapse;font:12px/1.4 ui-monospace,monospace;margin:4px 0 10px}.h3-sum th,.h3-sum td{padding:4px 6px;border-bottom:1px solid var(--line);text-align:left}.h3-sum th{color:var(--accent);font-weight:600}.h3-sum td:first-child{color:var(--dim)}
.d3-msg{border:1px solid var(--line);border-radius:8px;padding:7px 9px;margin:6px 0 8px -18px;font:12px/1.45 ui-monospace,monospace;list-style:none}
.d3-mh{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:5px}.d3-mh b{color:var(--ink)}.d3-mh span{color:var(--dim)}
.d3-f{display:flex;flex-wrap:wrap;gap:5px}
.d3-f span{display:inline-grid;gap:1px;padding:3px 7px;border:1px solid var(--line);border-radius:6px;color:var(--ink)}
.d3-f small{font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}
.d3-dora{display:flex;gap:5px;margin:8px 0 0}.d3-dora span{flex:1;text-align:center;padding:4px 2px;border:1px solid var(--line);border-radius:7px;font:11px ui-monospace,monospace;color:var(--dim)}
.d3-dora b{font-size:13px}.d3-dora .done{color:var(--ink)}.d3-dora .on{color:var(--ink);border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}.d3-dora .on b,.d3-dora .done b{color:var(--accent)}
.o3-back{position:fixed;left:16px;top:58px;z-index:5;font:12px ui-monospace,monospace;color:var(--dim);text-decoration:none;pointer-events:auto}
.o3-back:hover{color:var(--ink)}
@media (max-width:900px){
  #info{left:8px;right:8px;max-width:none;bottom:8px;max-height:40vh;font-size:13px}
  #swatches,#read,#hint,#credit{display:none!important}
  .o3-back{top:92px}
  #ctl-raid{top:auto!important;bottom:calc(40vh + 18px)!important;left:8px!important;right:8px!important;width:auto!important;flex-direction:row!important;gap:8px!important}
  #ctl-raid button{flex:1;justify-content:center;text-align:center}
  #ctl-raid button:nth-child(2){order:-1}
  #ctl-raid button:nth-child(n+3),#ctl-raid .sep{display:none!important}
}
.embedded .o3-back{display:none}
.embedded #info{left:8px;right:8px;max-width:none;bottom:8px;max-height:40vh;font-size:13px}
.embedded #swatches,.embedded #read,.embedded #hint,.embedded #credit{display:none!important}
.embedded .o3-back{top:92px}
.embedded #ctl-raid{top:auto!important;bottom:calc(40vh + 18px)!important;left:8px!important;right:8px!important;width:auto!important;flex-direction:row!important;gap:8px!important}
.embedded #ctl-raid button{flex:1;justify-content:center;text-align:center}
.embedded #ctl-raid button:nth-child(2){order:-1}
.embedded #ctl-raid button:nth-child(n+3),.embedded #ctl-raid .sep{display:none!important}

.r3-xor{margin:4px 0 8px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:12px/1.5 ui-monospace,monospace;color:var(--ink);white-space:pre}
.r3-lay td.r3-p{color:#e0a73a;font-weight:600}.r3-lay td.r3-q{color:#a98bff;font-weight:600}.r3-lay td.r3-bad,.r3-lay th.r3-bad{color:#ff5a4a;text-decoration:line-through}
`;
const reps = [
  ["<title>Iso 3D</title>", "<title>RAID em 3D · SDLabs</title>"],
  ["<i></i>Iso 3D</div>", "<i></i>RAID · 3D</div>"],
  ["</style>", css + "</style>"],
  ["</head>", "<script>if (new URLSearchParams(location.search).has(\"embed\")) document.documentElement.classList.add(\"embedded\");</script></head>"],
  ['<div class="ui" id="info">', '<a class="o3-back" href="../#aula-13-resumo-raid">Voltar ao módulo</a>\n<div class="ui" id="info">'],
  ["/* paste 3D figure modules here */", read("fig3d.js")],
];
for (const [a, b] of reps) { if (!s.includes(a)) throw new Error("não achei: " + a); s = s.replace(a, b); }
s = s.replace('<html lang="en">', '<html lang="pt-BR">');
const OUT = join(HERE, "../../../public/labs/storage-raid-io/raid-3d");
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), s);
console.log("wrote", join(OUT, "index.html"), (s.length / 1024).toFixed(0) + " KB");
