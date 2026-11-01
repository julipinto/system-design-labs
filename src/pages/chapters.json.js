// /chapters.json: para cada módulo, o capítulo seguinte (nome, frase de abertura, link). O fim do quiz
// (public/shared/next-chapter.js) lê daqui, já que as páginas do quiz são estáticas.
import { chapters } from '../lib/chapters.js';
import { withBase } from '../lib/url.js';

export async function nextMap(lang) {
  const all = await chapters(lang), out = {};
  all.forEach((c, i) => { const n = all[i + 1]; if (n) out[c.slug] = { title: n.title, lead: n.lead, href: withBase(`${lang === 'en' ? 'en/' : ''}labs/${n.slug}/`) }; });
  return out;
}
export async function GET() { return new Response(JSON.stringify(await nextMap('pt')), { headers: { 'Content-Type': 'application/json' } }); }
