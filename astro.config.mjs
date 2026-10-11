// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';

// Publicado em https://julipinto.github.io/system-design-labs/ (GitHub Pages, project site).
export default defineConfig({
  site: 'https://julipinto.github.io',
  base: '/system-design-labs',
  output: 'static',
  // O texto das aulas é HTML escrito à mão: sem aspas curvas automáticas e sem ~texto~ virando riscado (GFM).
  // O MDX herda este processor.
  markdown: { processor: satteri({ features: { gfm: false, smartPunctuation: false } }) },
  integrations: [mdx()],
});
