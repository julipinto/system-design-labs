# Sistema de design do SDLabs

Página viva: `/sistema-de-design/` (`src/pages/sistema-de-design.astro`). Lá cada token e cada componente aparece em uso, com a Lena e o produto 42 (o gato de pelúcia).

## Princípios

1. **Uma cor, sem brilho.** O sódio (`#ff9d3c`, o mesmo das figuras iso-glow) marca só o que está ativo: a aula atual na régua, o "Faça agora", o botão principal, o chip escolhido, a figura em foco. É cor e traço de 1px, nunca halo. Se tudo é laranja, nada é.
2. **Traço fino em vez de caixa e de enfeite.** Seções se separam por réguas de 1px. Caixa só para o que se manipula (widget, figura, ficha, painel). Nunca caixa dentro de caixa, borda colorida grossa à esquerda, cantos de mira, tracinho embaixo do título ou pontinho antes do rótulo.
3. **Texto comum para rótulo, mono para dado.** "Aula 10 de 13", "Em uma frase", "Faça agora", "Figura 3D", "9 aulas": Atkinson em caixa normal. Mono só para dado de verdade: IP, SQL, comando, contador, nome de chave. Títulos em peso médio (600); a hierarquia vem do tamanho.
4. **Celular primeiro.** Alvo de toque de 48px, uma aula por vez, nada importante atrás da barra fixa. Conferir em 390px e 1280px, nos dois temas.
5. **Mesmos dados da história.** Exemplos de componente usam a Lena, a loja, o produto 42 e as cidades SP, Rio e Recife.

Também ficam de fora: degradê roxo/azul, Inter em tudo, ícone em quadradinho sobre cada título, rótulo pequeno em cima do título (o "Aula N de T" vai embaixo), cinza sobre cor.

### Sinais de "feito por IA" que saíram (outubro de 2026)

O SDLabs tinha o visual "técnico" que IA produz por padrão. Saíram, e não voltam:

| Sinal | Onde estava | Agora |
|---|---|---|
| Rótulo mono em CAIXA ALTA com entreletra larga | "AULA 2 DE 7", "EM UMA FRASE", "FAÇA AGORA", "9 AULAS", widgets, painel das figuras | Atkinson 600, caixa normal, cor de apoio |
| Pontinho colorido antes do rótulo | rótulos, logo, widget, ficha, callouts | sai; ponto só onde marca estado (quiz, `.lit` em uso real) |
| Halo de brilho (`box-shadow` colorido sem deslocamento) | "Faça agora", régua, botão, figura, prévia da home | sai; `--glow` e `--glow-ring` viraram apelidos sem efeito |
| Tracinho laranja embaixo do título | aula, home, quiz | sai |
| Cantos de mira (marcas de registro) | figura e widget | sai; prancha de traço fino com cantos de 10px |
| Números "01 02 03" em mono | home | "1 2 3" em sans, cor fraca |
| Título em peso 800 | todos | 600 |
| Caractere como ícone grudado ("Voltar←") | botões das figuras | a tecla some quando o botão é centralizado |

Referência de tom: o template *critter atlas* (uberdesigner.ai), uma enciclopédia 3D interativa: título grande em peso regular, rótulo pequeno em cinza sem cor, número grande e leve com a unidade pequena, cor de destaque num ponto só.

## Tokens (`public/shared/sdlabs.css`)

| Grupo | Tokens | Nota |
|---|---|---|
| Chão e painéis | `--bg` `--surface` `--sunken` | escuro `#121314` é o chão da cena 3D; claro `#edeeee` é cinza frio, não creme |
| Traço | `--line` (1px decorativo), `--line-strong` (borda de controle, 3:1) | `--hair` 1px, `--stroke` 1,5px |
| Texto | `--ink` `--ink-hi` `--muted` `--faint` | todos ≥ 4,5:1 sobre `--bg` e `--surface` nos dois temas |
| Ativo | `--accent-ink` (texto/traço), `--accent-fill` (preenchimento), `--on-accent`, `--accent-wash` | no claro, `--accent-ink` é `#a34a00` (5,1:1) |
| Dados e estado | `--signal` (segunda série, bits, barras), `--ok`, `--bad`, `--warn` | |
| Estado | `--ring` (selecionado: 1px por dentro, sem halo) | `--glow` e `--glow-ring` ficaram como apelidos sem efeito, para CSS antigo; não usar em CSS novo |
| Tipo | `--sans` `--mono`, `--fw-display` 600 · `--fw-title` 600, `--fs-label` 14 (sans) · `--fs-sm` 14,5 · `--fs-body` 17,5 · `--fs-lead` 19 · `--fs-h3` 21 · `--fs-h2` · `--fs-h1` | `--measure` 46rem (~70 caracteres) |
| Espaço | `--s-1` 4 … `--s-8` 64, `--gutter` 16, `--page` 960, `--tap` 48 | mais espaço acima do título que abaixo |
| Forma | `--r-1` 3 (código, bit), `--r-2` 6 (controle), `--r-3` 10 (painel), `--r-pill` | |
| Movimento | `--ease-out`, `--ease-io`, `--dur-1` 120 · `--dur-2` 200 · `--dur-3` 320 ms | só estado; `prefers-reduced-motion` desliga |

Apelidos antigos continuam valendo para os widgets e a figura OSI 2D: `--card` = `--surface`, `--fg` = `--ink`, `--accent-2` = `--signal`, `--accent`.

**Atenção:** o modelo das figuras (`tools/iso-glow/gallery-3d.html`) escreve `--accent` no `<html>` da página que a embute, para seguir o seletor de cor da figura. Por isso o design usa `--accent-ink`. CSS novo não deve usar `var(--accent)`.

Fontes: Atkinson Hyperlegible Next (variável, com itálico) e Atkinson Hyperlegible Mono, em `public/shared/fonts/` (OFL), subconjunto latino, `font-display: swap`. Texto + mono somam 52 KB; o itálico (37 KB) só baixa se a página usar.

## Onde fica o CSS

- `public/shared/sdlabs.css`: tokens, fontes, base (seleção, foco, links, rolagem), `.lit`, `.label` (sans) e `.data` (mono).
- `src/styles/lesson.css`: aula, barra fixa, índice, botões, chips e a moldura `.widget`.
- `src/styles/widgets.css`: peças de widget que mais de um módulo usa (`sr-*` das calculadoras e tabelas, `ib-*` do simulador de transações, `pc-*` e `ls-*`).
- `src/styles/<módulo>.css`: só o que é do módulo. Antes de copiar uma regra de outro módulo, mova-a para `widgets.css`.
- `src/styles/module.css` (topo e rodapé do módulo), `glossary.css`, `home.css`.
- `public/shared/quiz.css`: um arquivo para todos os quizzes. O `index.html` de cada quiz aponta para `../../../shared/quiz.css`.

## Quando usar cada componente

| Componente | Quando | Regra visual |
|---|---|---|
| `Lesson` | uma por aula | título primeiro (600), linha "Aula N de T · Leitura ~min" em sans 15px embaixo, régua de 1px |
| `p.ponte` / `p.gancho` | primeira e última frase da aula | ponte em `--fs-lead`; gancho com régua em cima |
| `OneLiner` | a frase para guardar, logo no começo | entre duas réguas, rótulo "Em uma frase:" em cor de apoio |
| `DoIt` | uma ação concreta que a figura ou o widget mostra | a única caixa com a cor da aula: traço de 1px em sódio, rótulo em sódio, sem halo nem pulso |
| `HowItWorks` + `ol.flow.steps` | sequência que acontece em ordem | número mono num anel, fio de 1px ligando os passos |
| `WhyItMatters` | 2 a 4 consequências | travessão fino como marcador |
| `.callout.why` / `.remember` | motivo de uma escolha / o que guardar | caixa de traço fino; o rótulo leva a cor (azul ou verde), sem ponto |
| `Deep` | o texto longo, fechado | entre réguas; ícone + vira − aceso quando abre |
| `Sources` | 2 a 6 links por aula, dentro do `Deep` | lista com régua fina em cima, seta desenhada em CSS |
| `Flashcards` | 3 a 5 perguntas no fim | linha tocável; "Ver resposta" é link de texto que vira "Esconder" em sódio |
| `DoneButton` | automático no fim da `Lesson` | botão sódio; entendida vira contorno verde e o traço da régua fica verde |
| `Widget` | simulador ou calculadora | prancha de traço fino, cantos de 10px, título em sans 18px; a borda esquenta com o foco dentro |
| `Figure3D` | figura iso-glow com `?mode=` | prancha escura nos dois temas, cantos de 10px; desktop: iframe com borda sódio no foco (sem halo); celular: prévia + botão sódio |
| Glossário | automático (dados em `src/data/glossary-*.js`) | sublinhado pontilhado; ficha com o nome em 600; gaveta no celular |
| `ModuleLayout` | toda página de módulo | barra fixa: anterior · aula atual · próxima · quiz; régua com um traço por aula |
| Home (`src/pages/index.astro`) | um item por módulo, na ordem da história | número em sans (fraco), título 600, prévia da figura no desktop, progresso salvo |
| Quiz | `public/labs/<módulo>/quiz/` | opção escolhida com `--ring`; certo verde, errado vermelho |

## Celular (390px e 360px)

Regras fixadas no refinamento mobile. Valem para tudo até 480px, salvo quando dito.

1. **Grade de 4/8px.** Entre blocos da aula (frase, "Faça agora", figura, widget): 24px. Antes de um título de seção (`h3.sec`): 48px, e nada além disso (a legenda solta da figura somava ~30px a mais). Mais espaço acima do título que abaixo.
2. **Respiro lateral de 20px** (`--gutter` vira 20px até 480px).
3. **Cabeçalho do módulo curto:** marca e rótulo, título a 28px e a descrição numa linha só, com o botão "mais" (44px de toque) que abre o resto. Sem JS a descrição aparece inteira. Até 400px o rótulo do topo fica só "N aulas".
4. **Barra fixa continua fixa.** 8px de respiro, setas de 44×48, quiz compacto, título da aula em até duas linhas (nunca "Introdução ao cac…"). Régua: não lida apagada, entendida verde, atual alta em sódio; marco de 5 em 5 é risco de escala no vão.
5. **Figura 3D:** no celular a legenda vira rótulo no canto da prancha ("Fig N"), em `--on-plate` (a prancha é escura nos dois temas).
6. **Alvos de toque ≥ 44px** em tudo que não é termo dentro de frase: marca do topo, links do glossário completo, botão fechar da ficha, chips (também de largura), sliders, caixas de marcar (o rótulo inteiro conta), links de ação do quiz. Termos do glossário dentro do texto ficam como texto (exceção de alvo em linha).
7. **Tabelas e código rolam dentro do bloco** (`.sr-tablewrap`, `pre`). Tabela de resultado de duas colunas (`.pc-table`) deixa o rótulo quebrar, para o valor não virar uma tira de 10px.
8. **Home:** o número do módulo fica na linha do título e o texto usa a largura toda (até 760px).
9. **Quiz:** links de ação ("Desmarcar todos", "Zerar progresso") alinhados à borda do conteúdo, sem recuo; cartões de tópico com 12×16px de respiro, 12px entre eles e a segunda linha do título alinhada depois da caixa de marcar (desenhada, 14px); rodada 5/10/20 com o número em sans 20px e "perguntas" como rótulo embaixo; 24px entre a pergunta e as opções; a tecla da opção alinha com a primeira linha.
10. **Tipografia no celular.** A escala é a do desktop com quatro ajustes (até 480px), por media query e não por `clamp()`, porque aqui o rótulo precisa *crescer* na tela pequena:

    | Papel | Desktop | Celular | Nota |
    |---|---|---|---|
    | Corpo (`--fs-body`) | 17,5px / 1,65 | igual | ~38 caracteres por linha a 360px; medida máxima `--measure` |
    | Lead, "Em uma frase", "Faça agora" | 19px | igual | |
    | Título da aula (`--fs-h2`) | clamp(28px, 7,4vw, 38px) | 28px | é o título que se lê; maior que o do módulo |
    | Título do módulo | `--fs-h1` | 26px | vira cabeçalho de página, não compete com a aula |
    | Descrição do módulo | 19px | 16px, uma linha + "mais" | |
    | Rótulo (`--fs-label`, sans) | 14px | igual | "Em uma frase", "Faça agora", topo; em caixa normal não precisa crescer |
    | Rodapé (sans) | 14px | igual | |
    | `pre` | 13,5px | 14px | rola dentro do bloco |
    | Código em linha | 0,86em | igual | ~15px no corpo |

    **Piso de 12px** para qualquer texto (dados de widget, cabeçalhos de tabela, bits, selos do glossário, rótulo da rodada do quiz). Contraste: `--muted` 6,4:1 e `--faint` 5,1:1 no escuro; 6,0:1 e 5,4:1 no claro (4,9:1 sobre `--sunken`). **Controles de formulário herdam a fonte** (`button,input,select,textarea{font:inherit}` na base), senão o navegador usa Arial 13,3px.
11. **Fim da aula:** depois dos flashcards não há segunda régua; a mensagem vazia do "Entendi" não reserva espaço.

- **Alvo de toque ≥ 44 × 44 px em tudo que se toca.** Termo do glossário no meio do texto ganha uma área invisível centrada (`.gl-term::after`), sem mudar a altura da linha; slider tem `min-height: 44px` em `widgets.css`. Exceções: link no meio da frase (WCAG 2.5.8) e o rótulo acima de um controle. Conferir com `.maestri/tarefas/toque.mjs`.

## Como verificar

- `npm run build` sem erro.
- Capturas em 390×844, 360×780 e 1280×800, claro e escuro, sem scroll lateral e com console limpo (ver CLAUDE.md). A 360px, conferir também os widgets dos 5 módulos em "Ver tudo em uma página": nada pode passar da moldura (ela corta com `overflow:hidden`, então o estouro some em vez de aparecer).
- Contraste: texto ≥ 4,5:1; borda de controle ≥ 3:1. Os números estão na seção "Cor" da página viva.
- Antes e depois desta mudança: `docs/design/antes-depois/`.
