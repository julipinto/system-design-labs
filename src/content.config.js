import { readdirSync } from 'node:fs';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Uma aula por arquivo MDX. O nome do arquivo vira o id da seção (âncora #aula-...).
const lesson = z.object({
  title: z.string(),   // título da aula (h2, índice e barra fixa)
  order: z.number(),   // posição no módulo, a partir de 1
  min: z.number(),     // tempo de leitura em minutos
});

// Cada pasta de src/content/ (menos as que começam com "_") é um módulo: a coleção tem o nome da pasta.
// Módulo novo não precisa mexer aqui; basta criar src/content/<slug>/.
const slugs = readdirSync('./src/content', { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
  .map((d) => d.name);

// Versão em inglês: src/content/_en/<slug>/, coleção "en-<slug>". Mesmos nomes de arquivo, então as âncoras #aula-... são as mesmas.
let enSlugs = [];
try { enSlugs = readdirSync('./src/content/_en', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch {}

export const collections = Object.fromEntries([
  ...slugs.map((slug) => [slug, defineCollection({ loader: glob({ pattern: '*.mdx', base: `./src/content/${slug}` }), schema: lesson })]),
  ...enSlugs.map((slug) => ['en-' + slug, defineCollection({ loader: glob({ pattern: '*.mdx', base: `./src/content/_en/${slug}` }), schema: lesson })]),
]);
