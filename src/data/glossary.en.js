// Glossário em inglês, por módulo: cada src/data/en/glossary-<slug>.js exporta `terms` no mesmo formato de glossary.js.
// Módulo sem arquivo aqui fica sem glossário na versão em inglês.
const files = import.meta.glob('./en/glossary-*.js', { eager: true });
export const glossariesEn = Object.fromEntries(Object.entries(files).map(([p, m]) => [p.replace(/^.*glossary-|\.js$/g, ''), m.terms]));
