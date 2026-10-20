# Sistema de design do SDLabs

Página viva: `/sistema-de-design/` (`src/pages/sistema-de-design.astro`). Lá cada token e cada componente aparece em uso, com a Lena e o produto 42 (o gato de pelúcia).

## Princípios

1. **Uma cor que acende.** O sódio (`#ff9d3c`, o mesmo das figuras iso-glow) marca só o que está ativo: a aula atual na régua, o "Faça agora", o flashcard aberto, a figura em foco, a ficha do glossário. Se tudo acende, nada acende.
2. **Traço fino em vez de caixa.** Seções se separam por réguas de 1px. Caixa só para o que se manipula (widget, figura, ficha, painel). Nunca caixa dentro de caixa, nunca borda colorida grossa à esquerda.
3. **Mono para rótulo, número e dado.** "Aula 10 de 13", contadores, IP, SQL, nome de peça. O texto corrido e os títulos ficam na Atkinson Hyperlegible Next.
4. **Celular primeiro.** Alvo de toque de 48px, uma aula por vez, nada importante atrás da barra fixa. Conferir em 390px e 1280px, nos dois temas.
5. **Mesmos dados da história.** Exemplos de componente usam a Lena, a loja, o produto 42 e as cidades SP, Rio e Recife.

Também ficam de fora: degradê roxo/azul, Inter em tudo, ícone em quadradinho sobre cada título, rótulo pequeno em cima do título (o "Aula N de T" vai embaixo), cinza sobre cor.

## Tokens (`public/shared/sdlabs.css`)

| Grupo | Tokens | Nota |
|---|---|---|
| Chão e painéis | `--bg` `--surface` `--sunken` | escuro `#121314` é o chão da cena 3D; claro `#edeeee` é cinza frio, não creme |
| Traço | `--line` (1px decorativo), `--line-strong` (borda de controle, 3:1) | `--hair` 1px, `--stroke` 1,5px |
| Texto | `--ink` `--ink-hi` `--muted` `--faint` | todos ≥ 4,5:1 sobre `--bg` e `--surface` nos dois temas |
| Ativo | `--accent-ink` (texto/traço), `--accent-fill` (preenchimento), `--on-accent`, `--accent-wash` | no claro, `--accent-ink` é `#a34a00` (5,1:1) |
| Dados e estado | `--signal` (segunda série, bits, barras), `--ok`, `--bad`, `--warn` | |
| Brilho | `--glow` (ponto aceso), `--ring` (selecionado: 1px sem halo), `--glow-ring` (aceso: 1px + halo) | `--glow-ring` só no "Faça agora" e na figura em foco |
| Tipo | `--sans` `--mono`, `--fs-label` 12,5 · `--fs-sm` 14,5 · `--fs-body` 17,5 · `--fs-lead` 19 · `--fs-h3` 21 · `--fs-h2` · `--fs-h1` | `--measure` 46rem (~70 caracteres) |
| Espaço | `--s-1` 4 … `--s-8` 64, `--gutter` 16, `--page` 960, `--tap` 48 | mais espaço acima do título que abaixo |
| Forma | `--r-1` 3 (código, bit), `--r-2` 6 (controle), `--r-3` 10 (painel), `--r-pill` | |
| Movimento | `--ease-out`, `--ease-io`, `--dur-1` 120 · `--dur-2` 200 · `--dur-3` 320 ms | só estado; `prefers-reduced-motion` desliga |

Apelidos antigos continuam valendo para os widgets e a figura OSI 2D: `--card` = `--surface`, `--fg` = `--ink`, `--accent-2` = `--signal`, `--accent`.

**Atenção:** o modelo das figuras (`tools/iso-glow/gallery-3d.html`) escreve `--accent` no `<html>` da página que a embute, para seguir o seletor de cor da figura. Por isso o design usa `--accent-ink`. CSS novo não deve usar `var(--accent)`.

Fontes: Atkinson Hyperlegible Next (variável, com itálico) e Atkinson Hyperlegible Mono, em `public/shared/fonts/` (OFL), subconjunto latino, `font-display: swap`. Texto + mono somam 52 KB; o itálico (37 KB) só baixa se a página usar.

## Onde fica o CSS

- `public/shared/sdlabs.css`: tokens, fontes, base (seleção, foco, links, rolagem), `.lit` e `.label`.
- `src/styles/lesson.css`: aula, barra fixa, índice, botões, chips e a moldura `.widget`.
- `src/styles/widgets.css`: peças de widget que mais de um módulo usa (`sr-*` das calculadoras e tabelas, `ib-*` do simulador de transações, `pc-*` e `ls-*`).
- `src/styles/<módulo>.css`: só o que é do módulo. Antes de copiar uma regra de outro módulo, mova-a para `widgets.css`.
- `src/styles/module.css` (topo e rodapé do módulo), `glossary.css`, `home.css`.
- `public/shared/quiz.css`: um arquivo para todos os quizzes. O `index.html` de cada quiz aponta para `../../../shared/quiz.css`.

## Quando usar cada componente

| Componente | Quando | Regra visual |
|---|---|---|
| `Lesson` | uma por aula | título primeiro, linha mono "Aula N de T · ~min · Entendida ✓" embaixo, régua com traço aceso de 48px |
| `p.ponte` / `p.gancho` | primeira e última frase da aula | ponte em `--fs-lead`; gancho com régua em cima |
| `OneLiner` | a frase para guardar, logo no começo | entre duas réguas, rótulo mono aceso |
| `DoIt` | uma ação concreta que a figura ou o widget mostra | a única caixa acesa da aula (`--glow-ring`, ponto pulsando) |
| `HowItWorks` + `ol.flow.steps` | sequência que acontece em ordem | número mono num anel, fio de 1px ligando os passos |
| `WhyItMatters` | 2 a 4 consequências | travessão fino como marcador |
| `.callout.why` / `.remember` | motivo de uma escolha / o que guardar | caixa de traço fino, ponto azul ou verde no rótulo |
| `Deep` | o texto longo, fechado | entre réguas; ícone + vira − aceso quando abre |
| `Sources` | 2 a 6 links por aula, dentro do `Deep` | lista mono, seta desenhada em CSS |
| `Flashcards` | 3 a 5 perguntas no fim | linha tocável; a aberta ganha o ponto aceso |
| `DoneButton` | automático no fim da `Lesson` | botão sódio; entendida vira contorno verde e o traço da régua fica verde |
| `Widget` | simulador ou calculadora | prancha com marcas de registro; cantos e ponto acendem com o foco dentro |
| `Figure3D` | figura iso-glow com `?mode=` | prancha escura nos dois temas; desktop: iframe que acende com o foco; celular: prévia + botão sódio |
| Glossário | automático (dados em `src/data/glossary-*.js`) | sublinhado pontilhado; ficha com o nome aceso; gaveta no celular |
| `ModuleLayout` | toda página de módulo | barra fixa: anterior · aula atual · próxima · quiz; régua com um traço por aula |
| Home (`src/pages/index.astro`) | um item por módulo, na ordem da história | número mono, título, prévia da figura no desktop, progresso salvo |
| Quiz | `public/labs/<módulo>/quiz/` | opção escolhida com `--ring`; certo verde, errado vermelho |

## Como verificar

- `npm run build` sem erro.
- Capturas em 390×835 e 1280×800, claro e escuro, sem scroll lateral e com console limpo (ver CLAUDE.md).
- Contraste: texto ≥ 4,5:1; borda de controle ≥ 3:1. Os números estão na seção "Cor" da página viva.
- Antes e depois desta mudança: `docs/design/antes-depois/`.
