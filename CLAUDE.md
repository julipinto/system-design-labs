# SDLabs

Laboratórios visuais e interativos de System Design. Notas pessoais de estudo, escritas com palavras próprias,
a partir dos artigos públicos de Matheus Fidelis (https://fidelissauro.dev). Tudo em português.
Não citar curso nem marca de terceiros no site; não reproduzir títulos/durações de aulas pagas; crédito só ao blog público, com "sem vínculo".

## Forma
- Site estático, sem framework e sem etapa de build no navegador. Abre com duplo clique ou com `npx serve .`.
- `index.html` lista os módulos. Cada módulo fica em `labs/<slug>/index.html`.
- Figuras isométricas interativas são feitas com a skill `anatomy`. O script `build.mjs` do módulo gera o HTML final.
- `shared/sdlabs.css` guarda os tokens de cor (claro/escuro) usados por todas as páginas.

## Modelos neste andar
| Papel | Modelo | Por quê |
|---|---|---|
| Maestro / figuras anatomy | Opus 5.5 | Geometria isométrica e orquestração pedem o raciocínio mais forte |
| `sdlabs-writer` (condensar aulas, widgets simples) | Sonnet 5.5 | Escrita didática longa com bom custo |
| `sdlabs-researcher` (buscar fontes, conferir fatos) | Haiku 5.5 | Busca e leitura rápidas e baratas |
| `sdlabs-reviewer` (revisar exatidão técnica) | Sonnet 5.5 | Precisa de bom critério sem o custo do Opus |

## Build e verificação
- Módulo Protocolos de Rede: `node labs/protocolos-de-rede/build.mjs` gera `labs/protocolos-de-rede/index.html`
  a partir de `content.html` + `content.css` + `content.js` + `osi-figure.mjs` (a figura entra no marcador `<!--FIG-OSI-->`).
- Testar só a figura: `node labs/protocolos-de-rede/osi-figure.mjs [--light]` gera `osi-figure(-light).html`.
- O kit isométrico está copiado em `tools/anatomy/iso-kit.mjs` (vem da skill anatomy).
- Screenshots: `CHROME_PATH=~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome node ~/.claude/skills/anatomy/scripts/capture.mjs <página> --width 390|1280`.
- Sempre conferir em 390px e 1280px, temas claro e escuro, console sem erros e sem scroll horizontal.
