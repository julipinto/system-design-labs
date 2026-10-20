# SDLabs

Leia também PREMISSAS.md (o que torna um lab "inesquecível") e ESCRITA.md (cadência e encadeamento do texto; usa a skill writing-prose-like-a-human).

Laboratórios visuais e interativos de System Design. Notas pessoais de estudo, escritas com palavras próprias,
a partir dos artigos públicos de Matheus Fidelis (https://fidelissauro.dev). Tudo em português.
Não citar curso nem marca de terceiros no site; não reproduzir títulos/durações de aulas pagas; crédito só ao blog público, com "sem vínculo".

## Forma
- Site estático feito com Astro (sem framework de UI: nada de React, Vue ou Solid). Publicado em
  https://julipinto.github.io/system-design-labs/ (`base: '/system-design-labs'` no `astro.config.mjs`).
- Links internos sempre com `withBase('...')` de `src/lib/url.js` (nunca `/labs/...` cru, senão quebra no Pages).
- Onde fica cada coisa:
  - `src/pages/index.astro`: home com os cards dos módulos.
  - `src/pages/labs/<slug>/index.astro`: página do módulo; lê a collection e põe cada aula num `<Lesson>`.
  - `src/content/<slug>/*.mdx`: uma aula por arquivo (content collection, registrada em `src/content.config.js`).
    Nome do arquivo = âncora da aula. Frontmatter: `title`, `order`, `min`. Texto é HTML dentro do MDX.
  - `src/content/_template/`: aula de exemplo e passo a passo para criar `labs/<novo-modulo>`.
  - `src/layouts/BaseLayout.astro` (head, tokens, tema) e `ModuleLayout.astro` (topo, barra fixa de progresso, índice, modo foco).
  - `src/components/`: `Lesson`, `OneLiner`, `DoIt`, `HowItWorks`, `WhyItMatters`, `Deep`, `Sources`, `Flashcards`,
    `DoneButton`, `Widget` (lugar com `data-widget`) e `OsiFigure2D`.
  - `src/scripts/focus-mode.js`: modo foco, barra de estado, "Entendi" (localStorage `sdl-<módulo>:`) e flashcards.
  - `src/scripts/<slug>/widgets.js`: JS puro dos widgets do módulo (cada um se monta em `[data-widget="<nome>"]`).
  - `src/styles/lesson.css` (base das aulas, barra, botões, moldura do widget), `widgets.css` (peças de widget usadas por mais de um módulo),
    `module.css` (topo/rodapé do módulo), `glossary.css`, `home.css`, `<slug>.css` (só o que é do módulo).
  - `public/shared/sdlabs.css`: tokens (cor claro/escuro, tipo, espaço, raio, traço, brilho, movimento) e fontes de `public/shared/fonts/`.
    Segue prefers-color-scheme; `data-theme` força. Use `--accent-ink`, não `--accent` (a figura embutida reescreve `--accent`).
  - `public/shared/quiz.css`: CSS de todos os quizzes. Sistema de design: `docs/design/SISTEMA.md` e a página `src/pages/sistema-de-design.astro`.
  - `src/figures/`: figuras. `anatomy/iso-kit.mjs` (kit da skill anatomy), `osi/` (figura 2D: `osi-figure.mjs`,
    `osi-data.js`, `osi-data.css`), `osi-3d/` (build da 3D + `fig3d.js`). `tools/iso-glow/gallery-3d.html` é o modelo 3D.
  - `public/labs/<slug>/quiz/`: quiz standalone (HTML/JS puro, sem build); o `index.html` aponta para `../../../shared/quiz.css`.
- Figuras isométricas interativas são feitas com a skill `anatomy`. A 2D entra na página em tempo de build
  (`OsiFigure2D.astro` chama `buildOsiFigure()` e injeta css/html/script).

## Modelos neste andar
| Papel | Modelo | Por quê |
|---|---|---|
| Maestro / figuras anatomy | Opus 5.5 | Geometria isométrica e orquestração pedem o raciocínio mais forte |
| `sdlabs-writer` (condensar aulas, widgets simples) | Sonnet 5.5 | Escrita didática longa com bom custo |
| `sdlabs-researcher` (buscar fontes, conferir fatos) | Haiku 5.5 | Busca e leitura rápidas e baratas |
| `sdlabs-qa` (testar páginas: screenshots, console, cliques) | Haiku 5.5 | Bom em uso de navegador e ~10x mais barato que o Sonnet |
| `sdlabs-reviewer` (revisar exatidão técnica) | Sonnet 5.5 | Precisa de bom critério sem o custo do Opus |

Como isso é automático:
- Padrão global (`~/.claude/settings.json`): Opus.
- Sessões abertas dentro de `sdlabs/` usam Sonnet (`sdlabs/.claude/settings.json`).
- O maestro em `system-design/.maestri/` usa Opus (`.maestri/.claude/settings.json`).
- Subagentes: o `model:` no frontmatter de `.claude/agents/*.md` decide.

## Build e verificação
- `npm install` uma vez. `npm run dev` (dev server), `npm run build` (gera `dist/`), `npm run preview` (serve o `dist/`).
- `npm run build:3d` gera `public/labs/protocolos-de-rede/osi-3d/index.html` (não versionado) a partir de
  `tools/iso-glow/gallery-3d.html` + `src/figures/osi-3d/fig3d.js` + os STAGES e o painel de `src/figures/osi/`.
  `dev` e `build` já rodam esse passo antes.
- Testar só a figura 2D: `node src/figures/osi/osi-figure.mjs [--light]` gera `src/figures/osi/osi-figure(-light).html`.
- Deploy: `.github/workflows/deploy.yml` (withastro/action + deploy-pages) em push na main. Exige Pages com Source: GitHub Actions.
- Screenshots: `CHROME_PATH=~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome node ~/.claude/skills/anatomy/scripts/capture.mjs <url> --width 390|1280 --select body --theme light|dark`
  com o `npm run preview` rodando (http://localhost:4321/system-design-labs/...).
- Sempre conferir em 390px e 1280px, temas claro e escuro, console sem erros e sem scroll horizontal.
