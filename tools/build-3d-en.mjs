// Gera a versão em inglês das figuras 3D: roda o build.mjs de cada figura que já tem fig3d.en.js,
// com FIG_LANG=en (saída em public/en/labs/<módulo>/<figura>/). Figura sem tradução fica só em português.
import { readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const dir = 'src/figures';
for (const f of readdirSync(dir)) {
  if (!existsSync(`${dir}/${f}/fig3d.en.js`)) continue;
  execFileSync('node', [`${dir}/${f}/build.mjs`], { stdio: 'inherit', env: { ...process.env, FIG_LANG: 'en' } });
}
