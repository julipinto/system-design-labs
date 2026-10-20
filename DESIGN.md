---
name: SDLabs
description: Laboratórios de System Design para mexer e não esquecer mais; a moldura de uma prancha técnica iluminada.
colors:
  sodium: "#ff9d3c"
  sodium-ink-light: "#a34a00"
  on-sodium: "#1a1004"
  signal: "#7dbbd9"
  signal-light: "#1c5f80"
  ok: "#4fd68f"
  ok-light: "#1b7343"
  bad: "#ff7a66"
  bad-light: "#b3261e"
  bg: "#121314"
  surface: "#191b1d"
  sunken: "#0d0e0f"
  line: "#2a2d30"
  line-strong: "#5b6269"
  ink: "#d6dbe1"
  ink-hi: "#f0f2f4"
  muted: "#8f98a3"
  faint: "#7f8791"
  plate: "#121314"
  bg-light: "#edeeee"
  surface-light: "#f8f8f7"
  sunken-light: "#e2e3e3"
  line-light: "#d3d6d8"
  line-strong-light: "#7d848a"
  ink-light: "#23272b"
  ink-hi-light: "#111315"
  muted-light: "#535a61"
  faint-light: "#5a6167"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(40px, 11vw, 76px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(34px, 9vw, 56px)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.028em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(28px, 7.4vw, 38px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.018em"
  title-section:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17.5px"
    fontWeight: 400
    lineHeight: 1.65
  body-sm:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.09em"
  data:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
    fontFeature: "tnum"
rounded:
  r-1: "3px"
  r-2: "6px"
  r-3: "10px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  gutter: "16px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-hi}"
    rounded: "{rounded.r-2}"
    padding: "8px 14px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.sodium}"
    textColor: "{colors.on-sodium}"
    rounded: "{rounded.r-2}"
    padding: "8px 14px"
    height: "44px"
  button-big:
    backgroundColor: "{colors.sodium}"
    textColor: "{colors.on-sodium}"
    rounded: "{rounded.r-3}"
    padding: "12px 22px"
    height: "56px"
  chip:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.sodium}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-hi}"
    rounded: "{rounded.r-2}"
    padding: "8px 12px"
    height: "44px"
  doit:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-hi}"
    typography: "{typography.lead}"
    rounded: "{rounded.r-3}"
    padding: "16px"
  callout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-3}"
    padding: "16px"
  widget:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-1}"
    padding: "24px 16px 16px"
  progress-status:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-hi}"
    rounded: "{rounded.r-2}"
    padding: "8px 12px"
    height: "48px"
  flashcard-answer:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-2}"
    padding: "12px 16px"
  glossary-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-3}"
    padding: "14px 16px 12px"
    width: "340px"
---

# Design System: SDLabs

Registro do sistema como foi construído. A fonte normativa dos valores é `public/shared/sdlabs.css`; a página viva é `/sistema-de-design/` (`src/pages/sistema-de-design.astro`); o guia de uso em prosa, com a tabela de quando usar cada componente, é `docs/design/SISTEMA.md`. Os tokens acima são os do tema escuro (o padrão); os sufixos `-light` são os do tema claro.

## Overview

**Creative North Star: "A prancha técnica iluminada"**

O site é a moldura das figuras iso-glow: o mesmo chão grafite, o mesmo traço fino, a mesma tinta fria e uma única cor de sódio que acende só no que está ativo. A aula é um documento calmo, lido de cima para baixo numa coluna estreita. O que está em uso naquele momento (a aula atual na régua, o "Faça agora", o flashcard aberto, a figura ou o widget com o foco dentro, a ficha do glossário) acende como as peças acesas das figuras. O resto fica em traço fino e cinza.

A densidade é de manual técnico, não de painel: réguas de 1px separam as seções, caixas só aparecem no que se manipula, rótulos, números e dados vão em mono caixa alta. O tema escuro é o padrão porque é o da cena 3D; o claro troca o grafite por um cinza-papel frio, não creme, e escurece o sódio de texto para manter o contraste.

O sistema recusa os cartões iguais com ícone, o degradê roxo/azul e a mesma fonte sem serifa genérica em tudo.

**Key Characteristics:**
- Uma cor de destaque (sódio), com brilho só no estado ativo.
- Réguas de 1px no lugar de caixas; caixa só para o que se manipula.
- Atkinson Hyperlegible Next no texto, Atkinson Hyperlegible Mono em rótulos, números e dados; as duas servidas pelo próprio site.
- Marcas de registro (cantos de corte) só nas pranchas manipuláveis: figura 3D e widget.
- Celular primeiro: barra fixa de progresso, uma aula por vez, alvos de toque de 44px ou mais.
- Dois temas completos (claro e escuro), seguindo `prefers-color-scheme`; `data-theme` no `<html>` força um deles.

## Colors

Grafite e tinta fria em quase tudo, com uma cor quente que só aparece onde há ação ou atenção.

### Primary
- **Sódio** (sodium): a luz do sistema. No escuro, é a mesma cor para texto, traço e preenchimento. Marca a aula atual, o "Faça agora", o botão principal, o chip ou passo selecionado, o sublinhado dos links, o anel de foco, o ponto aceso (`.lit`) e o traço curto que fecha o título de cada aula.
- **Sódio de texto no claro** (sodium-ink-light): o sódio escurecido para texto e traço sobre o cinza-papel (5,1:1 sobre o chão claro). Preenchimentos continuam no sódio cheio nos dois temas.
- **Tinta sobre sódio** (on-sodium): texto de botão principal e do botão da prévia 3D; 9:1 sobre o sódio.

### Secondary
- **Sinal** (signal / signal-light): segunda cor, só para dados: segunda série de um gráfico, bits, barras de limite, o rótulo de chamadas "Por que" e a transação T1 no simulador. Nunca indica estado ativo.

### Tertiary
- **Certo** (ok / ok-light): aula entendida, segmento concluído da régua, contador de progresso, resposta certa no quiz, chamada "Para guardar".
- **Errado** (bad / bad-light): resposta errada, passo que dá errado no simulador, campo inválido.

### Neutral
- **Chão grafite** (bg / bg-light): fundo da página e da barra fixa; no escuro, é o mesmo chão da cena 3D.
- **Painel** (surface / surface-light): o que se levanta do chão: barra de estado, "Faça agora", chamadas, ficha do glossário, botões.
- **Poço** (sunken / sunken-light): o que afunda: campos de entrada, código, resposta do flashcard, trilho das barras.
- **Traço** (line / line-light): régua decorativa de 1px entre seções e em volta de painéis.
- **Traço forte** (line-strong / line-strong-light): borda de controle (3:1 com o chão nos dois temas) e as réguas que emolduram "Em uma frase".
- **Tinta** (ink / ink-light): texto corrido.
- **Tinta alta** (ink-hi / ink-hi-light): títulos, negrito, links em repouso, frase-ponte.
- **Apoio** (muted / muted-light): rótulos mono, dicas, linha "Aula N de T".
- **Fraco** (faint / faint-light): marcadores de lista, números do índice, módulo "em breve"; ainda legível (4,7:1 ou mais).
- **Prancha** (plate): fundo das prévias e do iframe da figura 3D; escuro nos dois temas, porque a cena é escura.

### Named Rules
**A Regra da Uma Luz.** O sódio é a única cor de destaque e só acende no que está ativo agora. Se tudo acende, nada acende: numa aula, a única caixa acesa é o "Faça agora".

**A Regra do --accent-ink.** CSS novo usa `--accent-ink` para texto e traço e `--accent-fill` para preenchimento, nunca `var(--accent)`. O modelo das figuras (`tools/iso-glow/gallery-3d.html`) reescreve `--accent` no `<html>` da página que o embute, para seguir o seletor de cor da figura; `--accent` existe só como apelido antigo.

**A Regra da Cor de Dado.** Sinal, certo e errado são cores de dado e de veredito, não de decoração. Nenhuma delas substitui o sódio como marca do que está ativo.

## Typography

**Display Font:** Atkinson Hyperlegible Next (com system-ui, -apple-system, Segoe UI)
**Body Font:** Atkinson Hyperlegible Next
**Label/Mono Font:** Atkinson Hyperlegible Mono (com ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** uma família só, feita para leitura difícil de confundir, com pesos pesados (800) e entreletra apertada nos títulos e uma mono da mesma família para tudo que é rótulo, contagem ou dado. As duas são variáveis (200 a 800), servidas de `public/shared/fonts/` com subconjunto latino e `font-display: swap`; o itálico só baixa quando a página usa.

### Hierarchy
- **Display** (800, clamp de 40 a 76px, altura 1, entreletra -0,035em): só o "SDLabs" da home.
- **Headline** (800, clamp de 34 a 56px, altura 1,04, -0,028em): o nome do módulo no topo da página; cai para 28px abaixo de 480px, para o "Faça agora" da primeira aula aparecer acima da dobra. Largura máxima 18ch.
- **Title** (800, clamp de 28 a 38px, altura 1,15, -0,018em): o título de cada aula. O título do quiz usa a mesma família de forma (800, clamp de 26 a 36px).
- **Title de seção** (750, 21px, -0,01em): os h3 das seções da aula, com mais espaço em cima (48px) do que embaixo (12px).
- **Lead** (400, 19px, altura 1,6): frase-ponte, "Em uma frase" (em 600), texto do "Faça agora", subtítulo do módulo.
- **Body** (400, 17,5px, altura 1,65): texto corrido, numa coluna de 46rem (cerca de 70 caracteres).
- **Body pequeno** (14,5px): dicas de widget, fontes, notas.
- **Label** (mono 600 ou 700, 12,5px, entreletra 0,09em, caixa alta): "Aula N de T · ~min", nome de componente ("Em uma frase", "Faça agora"), título de widget, contadores, rótulo da figura 3D.
- **Data** (mono 700, 13px, algarismos tabulares): números de passo, índice, contadores, saídas de calculadora, SQL, IP, nome de peça.

### Named Rules
**A Regra do Mono para Dado.** Rótulo, número e dado vão em mono; texto corrido e títulos, nunca. Toda coluna de número usa algarismos tabulares.

**A Regra do Título Primeiro.** O título da aula vem antes da linha de estado; "Aula N de T · ~min" fica embaixo do título, em mono, nunca como rótulo pequeno em cima dele.

## Layout

Coluna única, centrada, com largura de página de 960px e margem lateral de 16px. Dentro da aula, o texto se limita a 46rem; widgets, figuras e grades de dados usam a largura da página inteira. O espaçamento é base 4 (4, 8, 12, 16, 24, 32, 48, 64), com 32px acima de cada aula e 48px antes de seções, do "Aprofundar", dos flashcards e do fim da aula.

A barra de estado é fixa no topo (`position: sticky`), com fundo de chão e régua de 1px embaixo: botão anterior, status da aula atual (abre o índice), botão próximo, botão do quiz e, embaixo, a régua graduada com um segmento por aula. Abaixo de 560px a barra fica mais baixa e o texto do status cai para 14px. O índice abre como painel sobre o conteúdo, com rolagem própria (até 75vh).

A home é uma lista de módulos, um por linha, separados por régua: número mono à esquerda, título e texto, progresso salvo. A partir de 760px entra uma terceira coluna de 220px com a prévia da figura. O glossário completo passa a duas colunas a partir de 900px. A ficha do glossário é balão no desktop e gaveta presa embaixo da tela abaixo de 640px. A figura 3D vira iframe a partir de 720px; abaixo disso é prévia com botão para tela cheia.

Os controles têm altura mínima de 44px; a barra fixa, o "Aprofundar" e as linhas do índice usam 48px (`--tap`).

## Elevation & Depth

O sistema é plano por tons: chão, painel levantado e poço afundado, separados por traço de 1px. Sombra de verdade só existe no que flutua sobre o conteúdo. O brilho não é elevação: é a luz do estado ativo, sempre em sódio (ou em verde no que acabou de ser concluído).

### Shadow Vocabulary
- **Ponto aceso** (`--glow`, halo de 12px em sódio a 55% no escuro): o ponto `.lit`, o segmento atual da régua, o botão principal no hover, a barra do título, a barra vencedora da calculadora.
- **Selecionado** (`--ring`, contorno interno de 1px em sódio, sem halo): chip, passo, opção do quiz, status aberto, botão pressionado.
- **Aceso** (`--glow-ring`, contorno de 1px mais halo de 22px): o "Faça agora". A figura 3D em foco usa o mesmo desenho escrito direto no componente (halo de 40px).
- **Flutuante** (`--shadow-pop`, sombra difusa dupla): só o painel do índice e a ficha do glossário.

### Named Rules
**A Regra do Selecionado e do Aceso.** Selecionado é contorno de 1px sem halo (`--ring`); aceso é contorno mais halo (`--glow-ring`) e fica só no "Faça agora" e na figura em foco. Escolher um chip não acende a página.

**A Regra do Plano por Padrão.** Nada tem sombra em repouso, exceto o que flutua (índice e ficha do glossário).

## Shapes

Cantos pequenos e consistentes: 3px para código, bit e a prancha do widget; 6px para controles, campos e painéis internos; 10px para painéis de leitura ("Faça agora", chamadas, ficha do glossário, painel do índice, botão grande); pílula só para chips e para o rótulo "Ver resposta". Os traços têm duas espessuras: 1px (`--hair`) para réguas e bordas, 1,5px (`--stroke`) para ícones desenhados e marcas de registro.

Os ícones são desenhados em CSS com traço (check, setas, mais/menos, o caret do índice), herdando a cor do texto; não há caracteres usados como ícone. Pontos de 7px (vazios com contorno, ou cheios e acesos) marcam estado em rótulos, flashcards, widgets e quiz.

### Named Rules
**A Regra da Régua em vez de Caixa.** Seções se separam por régua de 1px. Caixa só para o que se manipula ou se lê como peça (widget, figura, "Faça agora", chamada, ficha, painel). Nunca caixa dentro de caixa, nunca borda grossa colorida à esquerda.

**A Regra do Registro.** Marcas de registro (cantos de corte de 12 por 1,5px) aparecem só nas pranchas manipuláveis: a figura 3D e o widget. Ficam em traço forte em repouso e passam a sódio com o foco dentro.

## Components

### Buttons
- **Shape:** cantos de 6px; o botão grande do fim da aula e do quiz usa 10px e 56px de altura.
- **Padrão:** fundo de painel, tinta alta, borda de traço forte, 8 por 14px, Atkinson 650 a 15px, 44px de altura mínima.
- **Principal:** fundo sódio, texto em tinta sobre sódio, borda sódio.
- **Hover / Focus:** o padrão troca a borda para sódio; o principal ganha o ponto aceso (`--glow`). Ao pressionar, desce 1px. Foco é contorno de 2px em sódio a 2px de distância. Desabilitado fica a 42% de opacidade.
- **"Entendi" depois de marcado:** vira painel com texto e contorno verdes.

### Chips
- **Style:** mono 600 a 13px, fundo de chão, borda de traço forte, pílula, 44px de altura.
- **State:** hover troca a borda para sódio; selecionado (`aria-pressed`) fica com texto e contorno sódio (`--ring`). No quiz, a escolha de aulas usa cantos de 6px e um ponto que acende quando selecionada.

### Cards / Containers
- **"Faça agora":** a única caixa acesa da aula: borda sódio, painel com lavagem de sódio, `--glow-ring`, rótulo mono com ponto pulsando (2,4s; desligado com movimento reduzido), texto em lead.
- **Chamadas ("Por que", "Para guardar"):** traço fino, painel, cantos de 10px, 16px de respiro; o rótulo mono e o ponto mudam de cor (sinal ou verde), a borda não.
- **"Em uma frase":** sem caixa: duas réguas de traço forte, rótulo mono em sódio com ponto aceso, frase em lead 600.
- **Internal Padding:** 16px nos painéis de leitura; 10 por 12px nos painéis internos de widget.

### Inputs / Fields
- **Style:** mono 16px, fundo de poço, borda de traço forte, cantos de 6px, 44px de altura, até 260px de largura nos widgets.
- **Focus:** contorno de 2px em sódio. Sliders, caret e checkboxes usam o sódio como `accent-color`.
- **Error:** borda em vermelho (`aria-invalid`).

### Navigation
- **Barra de estado:** status da aula em Atkinson 650 a 15px, com reticências quando não cabe; botões quadrados de 48px com setas desenhadas; quiz em mono caixa alta. Aberto, o status ganha `--ring` e o caret vira e acende.
- **Régua graduada:** um traço de 5px por aula em traço forte a 55%; marcos com 9px; a aula atual sobe para 12px em sódio com brilho; concluída fica verde; a atual concluída fica verde com contorno de sódio. Ao marcar "Entendi", o traço cresce e assenta de sódio para verde em 900ms.
- **Índice:** linhas de 48px separadas por régua, número mono fraco à esquerda; a aula atual em sódio e peso 750; a concluída leva um check verde desenhado.
- **Mobile:** barra mais baixa; o número da aula some do status.

### Prancha do widget (signature)
Fundo de chão, traço fino, cantos de 3px, marcas de registro nos quatro cantos. Título em mono caixa alta com um ponto vazio; com o foco dentro, as marcas e o ponto acendem e a borda esquenta para uma mistura de sódio com traço.

### Figura 3D (signature)
Prancha escura nos dois temas, cantos de 6px, marcas de registro 5px para fora da prancha. No desktop é um iframe que acende (borda sódio mais halo) com o foco; no celular é a prévia com um botão sódio "Abrir a figura 3D". Legenda em mono embaixo: rótulo com ponto, dica e "Abrir em tela cheia".

### Flashcards
Lista de linhas tocáveis de 56px entre réguas; a pergunta em Atkinson 650; à direita, uma pílula mono "Ver resposta" que vira "Esconder" em sódio; a aberta acende o ponto. A resposta aparece num poço com cantos de 6px.

### Aprofundar
`details` fechado entre réguas, sem caixa; marcador redondo de 22px com mais desenhado que vira menos em sódio quando abre.

### Glossário
Termo com sublinhado pontilhado em traço forte; no hover ou aberto, fica sódio com sublinhado contínuo. A ficha é painel com traço forte, cantos de 10px e `--shadow-pop`, com o nome em 800 e ponto aceso; no celular, vira gaveta embaixo da tela com puxador e botão de fechar de 52px.

### Quiz
Opções como botões de largura total com tecla mono num quadrado de 3px; escolha com `--ring`; certo e errado ganham contorno e um fundo com 12% da cor. Barra da rodada em sódio aceso; pontuação final em mono 800.

## Do's and Don'ts

### Do:
- **Do** use `--accent-ink` para texto e traço ativos e `--accent-fill` para preenchimento.
- **Do** reserve `--glow-ring` para o "Faça agora" e a figura em foco; para selecionado, use `--ring`.
- **Do** separe seções com régua de 1px (`--line`) e use `--line-strong` em bordas de controle.
- **Do** ponha rótulos, contadores e dados em Atkinson Hyperlegible Mono, caixa alta e 0,09em de entreletra no rótulo, algarismos tabulares nos números.
- **Do** dê aos controles pelo menos 44px de altura e 48px aos da barra fixa.
- **Do** desenhe ícones em traço CSS com `currentColor`.
- **Do** confira os dois temas; o tema claro precisa do sódio de texto escurecido.

### Don't:
- **Don't** use `var(--accent)` em CSS novo: o modelo das figuras reescreve esse valor no `<html>`.
- **Don't** acenda mais de uma caixa por aula, nem use brilho para indicar seleção.
- **Don't** ponha caixa dentro de caixa nem borda grossa colorida à esquerda.
- **Don't** ponha marcas de registro fora da figura 3D e do widget.
- **Don't** use sinal, verde ou vermelho como cor de destaque.
- **Don't** ponha rótulo pequeno em cima do título; a linha "Aula N de T" vai embaixo.
- **Don't** use degradê roxo ou azul, nem cartões iguais com ícone em quadradinho sobre o título.
