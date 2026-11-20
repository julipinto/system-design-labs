// Builds the cover gallery and renders each cover to public/labs/<slug>/capa.webp (1200x750, dark theme).
// Usage: node tools/covers/build.mjs [slug ...]   (no slug = all covers)
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import sharp from 'sharp';

const here = new URL('.', import.meta.url).pathname;
const root = new URL('../../', import.meta.url).pathname;
const tpl = readFileSync(homedir() + '/.claude/skills/iso-glow/assets/gallery.html', 'utf8');
// covers.js holds the shared helper and modules 1-3; covers-*.js add the rest (module order on the home page is set in index.astro).
const args = process.argv.slice(2);
// Only load the extra files that hold a requested cover, so a half-written file elsewhere cannot break this render.
const extra = readdirSync(here).filter((f) => /^covers-.+\.js$/.test(f)).sort().map((f) => readFileSync(here + f, 'utf8'))
  .filter((src) => !args.length || args.some((a) => src.includes(`id: '${a}'`)));
const figs = [readFileSync(here + 'covers.js', 'utf8'), ...extra].join('\n');

// Cover mode: only the stage is visible, filling the viewport on the panel colour.
const css = `<style>
  body.cv * { visibility: hidden; }
  body.cv #stage, body.cv #stage * { visibility: visible; }
  body.cv { padding: 0; overflow: hidden; }
  body.cv #stage { position: fixed; inset: 0; width: 100vw; height: 100vh; background: var(--panel); z-index: 9; }
  #stage .face, #stage .detail, #stage .wire, #stage .glass, #stage .lit { stroke-width: 2; }
  #stage .wire.hot { stroke-width: 4; }
  #stage .lit { fill: var(--accent); stroke: var(--accent-hi); }
</style>`;
let page = tpl;
for (const [a, b] of [
  ['<title>Iso Figures</title>', '<title>Capas</title>'],
  ['/* paste figure scripts here (see examples/) */', figs + "\nif (/[?&]cover/.test(location.search)) { document.body.classList.add('cv'); addEventListener('load', () => document.body.appendChild(document.getElementById('stage'))); }"],
  ['</head>', css + '</head>'],
]) {
  if (!page.includes(a)) throw new Error('template marker missing: ' + a);
  page = page.replace(a, b);
}
const out = here + `capas-${process.pid}.html`;
writeFileSync(out, page);

const ids = [...figs.matchAll(/id: '([a-z0-9-]+)', name:/g)].map((m) => m[1]);
const want = args.length ? args : ids;
const chrome = homedir() + '/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
for (const id of want) {
  const png = `${root}public/labs/${id}/capa.png`;
  execFileSync('node', [homedir() + '/.claude/skills/anatomy/scripts/capture.mjs', `file://${out}?cover#${id}`,
    '--width', '1200', '--height', '750', '--scale', '1', '--theme', 'dark', '--select', '#stage', '--wait', '1500', '--out', png],
    { env: { ...process.env, CHROME_PATH: chrome }, stdio: 'inherit' });
  const info = await sharp(png).resize(1200, 750, { fit: 'cover' }).webp({ quality: 84 }).toFile(png.replace(/\.png$/, '.webp'));
  unlinkSync(png);
  console.log(id, 'capa.webp', info.size);
}
unlinkSync(out);
