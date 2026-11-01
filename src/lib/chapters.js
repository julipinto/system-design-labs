// Os capítulos da história, em ordem: o que a home (continuar, faltam N aulas), o fim do módulo e o fim do quiz
// (próximo capítulo) precisam saber de cada módulo. Nome e frase de abertura saem das páginas dos módulos
// (props heading e lead do ModuleLayout); as aulas, das coleções. Lido só no build.
import { getCollection } from 'astro:content';

export const ORDER = [
  'protocolos-de-rede', 'storage-raid-io', 'cap-acid-base', 'databases', 'cache', 'microsservicos', 'load-balancers',
  'api-gateways', 'bff', 'service-mesh', 'concorrencia', 'comunicacao-sincrona', 'comunicacao-assincrona', 'performance',
  'scale-cube', 'sharding', 'replicacao', 'cqrs', 'saga', 'event-sourcing', 'resiliencia', 'deployment',
  'capacity-planning', 'testes-de-carga', 'bulkhead', 'cell-based', 'disaster-recovery', 'observabilidade', 'provas-finais',
];

const PAGES = {
  pt: import.meta.glob('/src/pages/labs/*/index.astro', { query: '?raw', import: 'default', eager: true }),
  en: import.meta.glob('/src/pages/en/labs/*/index.astro', { query: '?raw', import: 'default', eager: true }),
};

// prop de texto da página: heading="…" ou lead={'…'} (com \' dentro)
function prop(src, name) {
  const m = src.match(new RegExp(`^\\s*${name}=(?:"([^"]*)"|\\{'((?:[^'\\\\]|\\\\.)*)'\\})`, 'm'));
  return m ? (m[1] ?? m[2].replace(/\\'/g, "'")) : '';
}

export async function chapters(lang) {
  const out = [];
  for (const slug of ORDER) {
    const src = PAGES[lang][`/src/pages/${lang === 'en' ? 'en/' : ''}labs/${slug}/index.astro`];
    if (!src) continue;
    const entries = (await getCollection(lang === 'en' ? `en-${slug}` : slug)).sort((a, b) => a.data.order - b.data.order);
    out.push({
      slug, title: prop(src, 'heading'), lead: prop(src, 'lead'),
      lessons: entries.map((e) => [e.id, e.data.title, e.data.min]),
    });
  }
  return out;
}

// o capítulo seguinte (ou null no último)
export async function nextChapter(lang, slug) {
  const all = await chapters(lang);
  const i = all.findIndex((c) => c.slug === slug);
  return i >= 0 && i < all.length - 1 ? all[i + 1] : null;
}
