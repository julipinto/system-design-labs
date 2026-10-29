// Línguas do site: o português fica na raiz (/labs/...), o inglês em /en/ (/en/labs/...).
// A língua sai da URL da página; os componentes pegam os textos da moldura daqui com t(Astro.url).
// O texto das aulas não passa por aqui: cada língua tem os seus .mdx (src/content/<slug>/ e src/content/_en/<slug>/).
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const LANGS = { pt: { html: 'pt-BR', name: 'Português' }, en: { html: 'en', name: 'English' } };

export function langOf(url) {
  return String(url.pathname).startsWith(BASE + '/en/') || url.pathname === BASE + '/en' ? 'en' : 'pt';
}

// Mesmo caminho na outra língua: /system-design-labs/labs/cache/ <-> /system-design-labs/en/labs/cache/
export function otherLangPath(url) {
  const rest = String(url.pathname).slice(BASE.length);
  return langOf(url) === 'en' ? BASE + (rest.replace(/^\/en(\/|$)/, '/') || '/') : BASE + '/en' + rest;
}

const UI = {
  pt: {
    deep: 'Aprofundar', doit: 'Faça agora', oneliner: 'Em uma frase:', how: 'Como funciona',
    why: 'Por que importa em System Design', sources: 'Fontes',
    fcTitle: 'Pra não esquecer', fcHint: 'Tente responder de cabeça. Depois clique na pergunta para conferir.',
    lessonOf: (n, total) => `Aula ${n} de ${total}`, reading: 'Leitura ', understood: 'Entendida',
    done: 'Entendi esta aula', prevLesson: 'Aula anterior', nextLesson: 'Próxima aula',
    glossary: 'Glossário', terms: (n) => `${n} termos`, layer: 'Camada', lesson: 'Aula',
    glHint: 'Os termos sublinhados nas aulas também abrem aqui. Toque em "Aula" para ir ao lugar onde o termo é explicado.',
    fig: 'Figura 3D', figOpen: 'Abrir a figura 3D', figFull: 'Abrir em tela cheia',
    figHint: 'Arraste para girar · Próximo passo ou setas do teclado para avançar · clique numa peça para ir até ela',
    brandAria: 'SDLabs: voltar para os módulos', lessons: (n) => `${n} aulas`, topics: (n) => `${n} tópicos`,
    glossaryLower: 'glossário', more: 'mais', less: 'menos', quiz: 'Quiz', quizAria: 'Fazer o quiz do módulo',
    quizCta: 'Fazer o quiz do módulo', onePage: 'Ver tudo em uma página', progress: 'Aulas entendidas',
    toc: 'Aulas do módulo', quizFinal: 'Teste o que aprendeu: quiz',
    credit: 'Notas pessoais de estudo, escritas com minhas palavras. Fonte: artigos públicos de Matheus Fidelis em <a href="https://fidelissauro.dev">fidelissauro.dev</a>. Sem vínculo com o autor ou com qualquer curso.',
    switchTo: 'English', switchAria: 'Read this page in English',
    specMin: () => 'min de leitura', specTerms: (n) => n === 1 ? 'termo novo' : 'termos novos',
    specFigs: (n) => n === 1 ? 'figura 3D' : 'figuras 3D', specLabs: (n) => n === 1 ? 'laboratório' : 'laboratórios',
  },
  en: {
    deep: 'Go deeper', doit: 'Try it now', oneliner: 'In one sentence:', how: 'How it works',
    why: 'Why it matters in System Design', sources: 'Sources',
    fcTitle: 'So you don’t forget', fcHint: 'Try to answer from memory. Then click the question to check.',
    lessonOf: (n, total) => `Lesson ${n} of ${total}`, reading: 'Reading ', understood: 'Understood',
    done: 'I understood this lesson', prevLesson: 'Previous lesson', nextLesson: 'Next lesson',
    glossary: 'Glossary', terms: (n) => `${n} terms`, layer: 'Layer', lesson: 'Lesson',
    glHint: 'Underlined terms in the lessons open here too. Tap "Lesson" to jump to where the term is explained.',
    fig: '3D figure', figOpen: 'Open the 3D figure', figFull: 'Open full screen',
    figHint: 'Drag to rotate · Next step or arrow keys to advance · click a part to go to it',
    brandAria: 'SDLabs: back to the modules', lessons: (n) => `${n} lessons`, topics: (n) => `${n} topics`,
    glossaryLower: 'glossary', more: 'more', less: 'less', quiz: 'Quiz', quizAria: 'Take the module quiz',
    quizCta: 'Take the module quiz', onePage: 'Show everything on one page', progress: 'Lessons understood',
    toc: 'Module lessons', quizFinal: 'Test what you learned: quiz',
    credit: 'Personal study notes, written in my own words. Source: public articles by Matheus Fidelis at <a href="https://fidelissauro.dev">fidelissauro.dev</a>. Not affiliated with the author or with any course.',
    switchTo: 'Português', switchAria: 'Ler esta página em português',
    specMin: () => 'min read', specTerms: (n) => n === 1 ? 'new term' : 'new terms',
    specFigs: (n) => n === 1 ? '3D figure' : '3D figures', specLabs: (n) => n === 1 ? 'hands-on lab' : 'hands-on labs',
  },
};

export function t(url) { return UI[langOf(url)]; }

// Módulos que já têm versão em inglês (pasta em src/content/_en/). Enquanto a tradução não termina,
// o link de língua só aparece onde a outra versão existe, e a home em inglês manda para o português no resto.
const EN_FILES = import.meta.glob('/src/content/_en/*/*.mdx');
const EN_SLUGS = new Set(Object.keys(EN_FILES).map((p) => p.split('/')[4]));
export function hasEn(slug) { return EN_SLUGS.has(slug); }
