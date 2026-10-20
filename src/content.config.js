import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Uma aula por arquivo MDX. O nome do arquivo vira o id da seção (âncora #aula-...).
const lesson = z.object({
  title: z.string(),   // título da aula (h2, índice e barra fixa)
  order: z.number(),   // posição no módulo, a partir de 1
  min: z.number(),     // tempo de leitura em minutos
});

const protocolosDeRede = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/protocolos-de-rede' }),
  schema: lesson,
});

const storageRaidIo = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/storage-raid-io' }),
  schema: lesson,
});

const capAcidBase = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/cap-acid-base' }),
  schema: lesson,
});

const databases = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/databases' }),
  schema: lesson,
});

const cache = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/cache' }),
  schema: lesson,
});

export const collections = { 'protocolos-de-rede': protocolosDeRede, 'storage-raid-io': storageRaidIo, 'cap-acid-base': capAcidBase, databases, cache };
