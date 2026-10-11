// Monta labs/protocolos-de-rede/index.html: conteúdo das aulas + figura OSI no lugar de <!--FIG-OSI-->.
//   node labs/protocolos-de-rede/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOsiFigure } from "./osi-figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(join(HERE, "content.html"), "utf8");
if (!content.includes("<!--FIG-OSI-->")) throw new Error("content.html sem o marcador <!--FIG-OSI-->");
const fig = buildOsiFigure();

const page = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Protocolos de Rede · SDLabs</title>
<meta name="description" content="Protocolos de rede: OSI, IP, TCP/UDP, TLS, DNS, DHCP, HTTP e tempo de resposta, com laboratórios interativos.">
<link rel="stylesheet" href="../../shared/sdlabs.css">
<link rel="stylesheet" href="content.css">
<style>
.sdl-top{max-width:960px;margin:0 auto;padding:20px 16px 0;display:flex;justify-content:space-between;align-items:center;gap:12px;font:12px/1.4 var(--mono);color:var(--muted)}
.sdl-top a{color:var(--muted);text-decoration:none}.sdl-top a:hover{color:var(--fg)}
.sdl-hero{max-width:960px;margin:0 auto;padding:28px 16px 0}
.sdl-hero h1{margin:0 0 8px;font-size:clamp(30px,7vw,46px);line-height:1.1;letter-spacing:-.02em}
.sdl-hero p{margin:0;max-width:640px;color:var(--muted);font-size:17px}
.sdl-credit{max-width:960px;margin:0 auto;padding:0 16px 48px;font:12px/1.6 var(--mono);color:var(--muted)}
.sdl-credit a{color:var(--muted)}
.sdl-content .lesson>div.osi-wrap{max-width:960px;margin:22px 0 30px}
${fig.css}
</style>
</head>
<body>
<div class="sdl-top"><a href="../../index.html">← SDLabs</a><span>Módulo · Protocolos de Rede</span></div>
<header class="sdl-hero">
  <h1>Protocolos de Rede</h1>
  <p>Protocolos de rede numa página só, com laboratórios que você mexe para ver acontecer.</p>
</header>
<main class="sdl-content">
${content.replace("<!--FIG-OSI-->", `<div class="osi-wrap">${fig.html}</div>`)}
</main>
<footer class="sdl-credit">Notas pessoais de estudo, escritas com minhas palavras. Fonte: artigos públicos de Matheus Fidelis em <a href="https://fidelissauro.dev">fidelissauro.dev</a>. Sem vínculo com o autor ou com qualquer curso.</footer>
<script src="content.js"></script>
<script type="module">${fig.script.replace(/<\/(script)/gi, "<\\/$1")}</script>
</body>
</html>
`;
writeFileSync(join(HERE, "index.html"), page);
console.log("wrote", join(HERE, "index.html"), (page.length / 1024).toFixed(0) + " KB");
