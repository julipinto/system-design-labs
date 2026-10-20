# Template de módulo

Esta pasta não é uma collection (não está em `src/content.config.js`) e não vai para o site.

## Criar `labs/<novo-modulo>`

1. Copie esta pasta para `src/content/<novo-modulo>/` e crie um `.mdx` por aula.
   - O nome do arquivo vira a âncora da aula: `aula-1-<assunto>.mdx` → `#aula-1-<assunto>`.
   - Frontmatter: `title`, `order` (1, 2, 3...) e `min` (tempo de leitura).
   - Escreva com palavras próprias. Crédito só ao blog público (fidelissauro.dev), com "sem vínculo".
2. Registre a collection em `src/content.config.js`:
   ```js
   const novoModulo = defineCollection({
     loader: glob({ pattern: '*.mdx', base: './src/content/<novo-modulo>' }),
     schema: lesson,
   });
   export const collections = { 'protocolos-de-rede': protocolosDeRede, '<novo-modulo>': novoModulo };
   ```
3. Copie `src/pages/labs/protocolos-de-rede/index.astro` para `src/pages/labs/<novo-modulo>/index.astro` e troque
   o nome da collection, `module`, `heading`, `lead`, `title`, `description` e o `quizHref`/`final` (tire se não houver quiz).
4. Widgets: o JS do módulo vai em `src/scripts/<novo-modulo>/widgets.js`, importado num `<script>` dentro de
   `<Fragment slot="head">` na página (veja a de protocolos). Cada widget procura `[data-widget="<nome>"]`
   e se monta ali; no MDX use `<Widget name="<nome>" title="..." hint="..." />`.
   Os estilos próprios vão em `src/styles/<novo-modulo>.css`, importado na página (só o que é do módulo; peças
   que outro módulo já usa ficam em `src/styles/widgets.css`, veja docs/design/SISTEMA.md). O quiz usa `public/shared/quiz.css`. A base das aulas
   (`src/styles/lesson.css`) e o modo foco (`src/scripts/focus-mode.js`) já vêm do `ModuleLayout`.
5. Figuras: cada uma em `src/figures/<nome>/`, com um componente em `src/components/` que gera o HTML em tempo
   de build (modelo: `OsiFigure2D.astro`).
6. Adicione o card do módulo em `src/pages/index.astro`, com `href={withBase('labs/<novo-modulo>/')}`.
7. `npm run build` e confira as telas em 390px e 1280px, claro e escuro.
