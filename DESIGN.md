---
name: SDLabs
description: Laboratórios de System Design para mexer e não esquecer mais; a moldura quieta de uma prancha técnica.
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
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(34px, 9vw, 56px)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(28px, 7.4vw, 38px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title-section:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 600
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
    fontFamily: "Atkinson Hyperlegible Next, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.35
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
  gutter: "16px (20px até 480px)"
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
    typography: "{typography.label}"
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
    rounded: "{rounded.r-3}"
    padding: "24px 24px 16px"
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

**Creative North Star: "A prancha técnica, impressa com calma"**

O site é a moldura das figuras iso-glow: o mesmo chão grafite, o mesmo traço fino, a mesma tinta fria e uma única cor de sódio que marca só o que está ativo. A aula é um documento calmo, lido de cima para baixo numa coluna estreita, como um bom livro técnico impresso: títulos em peso médio, rótulos em texto comum, réguas de 1px. A figura 3D é a única coisa que brilha, porque o brilho é a linguagem dela; em volta, a página não imita esse brilho.

Em outubro de 2026 o site perdeu o visual "técnico" que IA produz por padrão: rótulo mono em caixa alta com entreletra larga, pontinho colorido antes de cada rótulo, halo de brilho, tracinho embaixo do título, cantos de mira e numeração 01/02/03. A referência de tom é o template *critter atlas* (uberdesigner.ai): uma enciclopédia 3D interativa com título grande em peso regular, rótulos pequenos em cinza, número grande e leve com a unidade pequena e a cor de destaque num ponto só.

O tema escuro é o padrão porque é o da cena 3D; o claro troca o grafite por um cinza-papel frio, não creme, e escurece o sódio de texto para manter o contraste.

O sistema recusa os cartões iguais com ícone, o degradê roxo/azul, a fonte genérica em tudo e qualquer enfeite que não diga nada.

**Key Characteristics:**
- Uma cor de destaque (sódio), como cor e traço de 1px; nunca halo.
- Réguas de 1px no lugar de caixas; caixa só para o que se manipula.
- Atkinson Hyperlegible Next no texto, nos títulos (600) e nos rótulos (caixa normal); Atkinson Hyperlegible Mono só em dado e código.
- Celular primeiro: barra fixa de progresso, uma aula por vez, alvos de toque de 44px ou mais.
- Dois temas completos (claro e escuro), seguindo `prefers-color-scheme`; `data-theme` no `<html>` força um deles.

## Colors

Grafite e tinta fria em quase tudo, com uma cor quente que só aparece onde há ação.

### Primary
- **Sódio** (sodium): a cor do ativo. No escuro, é a mesma cor para texto, traço e preenchimento. Marca a aula atual na régua e no índice, o traço e o rótulo do "Faça agora", o botão principal, o chip ou passo selecionado, o sublinhado dos links, o anel de foco e o "Esconder" do flashcard aberto.
- **Sódio de texto no claro** (sodium-ink-light): o sódio escurecido para texto e traço sobre o cinza-papel (5,1:1 sobre o chão claro). Preenchimentos continuam no sódio cheio nos dois temas.
- **Tinta sobre sódio** (on-sodium): texto de botão principal e do botão da prévia 3D; 9:1 sobre o sódio.

### Secondary
- **Sinal** (signal / signal-light): segunda cor, só para dados: segunda série de um gráfico, bits, barras de limite, o rótulo da chamada "Por que" e a transação T1 no simulador. Nunca indica estado ativo.

### Tertiary
- **Certo** (ok / ok-light): resposta certa no quiz, check de aula entendida, chamada "Para guardar".
- **Errado** (bad / bad-light): resposta errada, passo que dá errado no simulador, campo inválido.

### Neutral
- **Chão grafite** (bg / bg-light): fundo da página e da barra fixa; no escuro, é o mesmo chão da cena 3D.
- **Painel** (surface / surface-light): barra de estado, "Faça agora", chamadas, ficha do glossário, botões.
- **Poço** (sunken / sunken-light): campos de entrada, código, resposta do flashcard, trilho das barras.
- **Traço** (line / line-light): régua de 1px entre seções e em volta de painéis.
- **Traço forte** (line-strong / line-strong-light): borda de controle (3:1 com o chão nos dois temas), as réguas de "Em uma frase" e a borda do widget em uso.
- **Tinta** (ink / ink-light): texto corrido.
- **Tinta alta** (ink-hi / ink-hi-light): títulos, negrito, links em repouso, frase-ponte, caixa de marcar do quiz marcada.
- **Apoio** (muted / muted-light): rótulos ("Em uma frase", "Aula N de T"), dicas, contador da trilha ("3/9", sans 600 com algarismos tabulares).
- **Fraco** (faint / faint-light): marcadores de lista, números do índice e da home, módulo "em breve"; ainda legível (4,7:1 ou mais).
- **Prancha** (plate): fundo das prévias e do iframe da figura 3D; escuro nos dois temas, porque a cena é escura.

### Named Rules
**A Regra da Uma Cor.** O sódio é a única cor de destaque e só marca o que está ativo agora. Se tudo é laranja, nada é: numa aula, a única caixa com a cor é o "Faça agora".

**A Regra do Sem Halo.** Estado ativo é cor e traço de 1px. Nenhum `box-shadow` colorido sem deslocamento no site; `--glow` e `--glow-ring` existem só como apelidos sem efeito para CSS antigo. O brilho mora dentro da figura 3D.

**A Regra do --accent-ink.** CSS novo usa `--accent-ink` para texto e traço e `--accent-fill` para preenchimento, nunca `var(--accent)`. O modelo das figuras (`tools/iso-glow/gallery-3d.html`) reescreve `--accent` no `<html>` da página que o embute.

**A Regra da Cor de Dado.** Sinal, certo e errado são cores de dado e de veredito, não de decoração. Nenhuma delas substitui o sódio como marca do que está ativo.

## Typography

**Display, Body e Label Font:** Atkinson Hyperlegible Next (com system-ui, -apple-system, Segoe UI)
**Data Font:** Atkinson Hyperlegible Mono (com ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** uma família feita para leitura difícil de confundir. Títulos em peso médio (600) com entreletra levemente apertada; a hierarquia vem do tamanho, não do preto. Rótulos são texto comum. A mono aparece só onde o conteúdo é dado: código, comando, IP, contador. As duas são variáveis (200 a 800), servidas de `public/shared/fonts/` com subconjunto latino e `font-display: swap`; o itálico só baixa quando a página usa.

### Hierarchy
- **Display** (600, clamp de 40 a 76px, altura 1, -0,03em): só o "SDLabs" da home.
- **Headline** (600, clamp de 34 a 56px, altura 1,04, -0,025em): o nome do módulo; 26px abaixo de 480px. Largura máxima 18ch.
- **Title** (600, clamp de 28 a 38px, altura 1,15, -0,02em): o título de cada aula e do quiz.
- **Title de seção** (600, 21px, -0,01em): os h3 da aula, com 48px em cima e 12px embaixo.
- **Lead** (400, 19px, altura 1,6): frase-ponte, "Em uma frase" (em 550), texto do "Faça agora", subtítulo do módulo.
- **Body** (400, 17,5px, altura 1,65): texto corrido, coluna de 46rem (cerca de 70 caracteres).
- **Body pequeno** (14,5px): dicas de widget, fontes, notas.
- **Label** (sans 600, 14px, caixa normal, cor de apoio): "Em uma frase:", "Faça agora", "Comando real", título das fontes, rótulo do topo, "9 aulas". A linha "Aula N de T · Leitura ~min" usa sans 500 a 15px.
- **Número de destaque** (sans 400, 26 a 80px, algarismos tabulares, unidade pequena em cor de apoio ao lado): fatos das calculadoras, pontuação do quiz.
- **Data** (mono 600, 13px, algarismos tabulares): SQL, IP, comando, chave, saída de calculadora.
- **Mostrador** (desenho, não fonte): número de destaque de widget em 7 segmentos; nota do quiz em pontos de LED (5×7). Ver "Números de destaque".

### Named Rules
**A Regra do Rótulo Comum.** Rótulo é texto em caixa normal, sem entreletra larga, sem ponto antes e sem cor de destaque (exceto o do "Faça agora", que é o ativo da aula). Caixa alta com entreletra larga não volta.

**A Regra do Mostrador.** 7 segmentos e pontos de LED são para número de dado, nunca para palavra, título ou rótulo. 7 segmentos no widget; pontos só no placar do quiz.

**A Regra do Mono para Dado.** Mono só para o que é dado, código ou medida. Mono como fantasia de "técnico" não entra.

**A Regra do Título Primeiro.** O título vem antes da linha de estado; nada de rótulo pequeno em cima do título.

## Layout

Coluna única, centrada, com largura de página de 960px e margem lateral de 16px (20px até 480px). Dentro da aula, o texto se limita a 46rem; widgets, figuras e grades de dados usam a largura da página inteira. O espaçamento é base 4 (4, 8, 12, 16, 24, 32, 48, 64), com 32px acima de cada aula e 48px antes de seções, do "Aprofundar", dos flashcards e do fim da aula.

A barra de estado é fixa no topo, com fundo de chão e régua de 1px embaixo: anterior, status da aula atual (abre o índice), próximo, "Quiz" (sans, caixa normal) e, embaixo, a régua com um segmento por aula e o contador em mono. Abaixo de 560px o status cai para 14px e mostra só o título da aula.

A home é uma lista de módulos, um por linha, separados por régua: número em sans fraco à esquerda (a ordem da história importa), título 600 e texto, progresso salvo. A partir de 760px entra a prévia da figura (220px). A ficha do glossário é balão no desktop e gaveta abaixo de 640px. A figura 3D vira iframe a partir de 720px; abaixo disso é prévia com botão para tela cheia.

Os controles têm altura mínima de 44px; a barra fixa, o "Aprofundar" e as linhas do índice usam 48px (`--tap`).

## Elevation & Depth

O sistema é plano por tons: chão, painel levantado e poço afundado, separados por traço de 1px. Sombra de verdade só no que flutua sobre o conteúdo: o painel do índice, a ficha do glossário e o botão sobre a prévia da figura (sombra difusa com deslocamento). Nenhum halo colorido.

### Shadow Vocabulary
- **Selecionado** (`--ring`, contorno interno de 1px em sódio): chip, passo, opção do quiz, status aberto, botão pressionado.
- **Flutuante** (`--shadow-pop`, sombra difusa dupla com deslocamento): painel do índice e ficha do glossário.

### Named Rules
**A Regra do Plano por Padrão.** Nada tem sombra em repouso, exceto o que flutua.

## Shapes

Cantos pequenos e consistentes: 3px para código e bit; 6px para controles, campos e painéis internos; 10px para painéis de leitura e pranchas ("Faça agora", chamadas, widget, figura, ficha, índice, botão grande); pílula só para chips. Traços: 1px (`--hair`) para réguas e bordas, 1,5px (`--stroke`) para ícones desenhados.

Os ícones são desenhados em CSS ou SVG com traço, herdando a cor do texto; nenhum caractere ou emoji usado como ícone. O ponto (`.lit`, 7px) só aparece onde marca estado real; a caixa de marcar do quiz é desenhada (14px, cantos de 3px, check em SVG).

### Named Rules
**A Regra da Régua em vez de Caixa.** Seções se separam por régua de 1px. Caixa só para o que se manipula ou se lê como peça. Nunca caixa dentro de caixa, nunca borda colorida com mais de 1px na lateral.

**A Regra do Sem Enfeite.** Nada de cantos de mira, tracinho de cor embaixo de título, pontinho antes de rótulo ou numeração 01/02/03. Se um elemento não diz nada, ele sai.

## Components

### Buttons
- **Shape:** cantos de 6px; o botão grande do fim da aula e do quiz usa 10px e 56px de altura.
- **Padrão:** fundo de painel, tinta alta, borda de traço forte, 8 por 14px, Atkinson 600 a 15px, 44px de altura mínima.
- **Principal:** fundo sódio, texto em tinta sobre sódio. No hover, o sódio clareia um pouco; sem halo.
- **Hover / Focus:** o padrão troca a borda para sódio. Ao pressionar, desce 1px. Foco é contorno de 2px em sódio a 2px de distância. Desabilitado fica a 42% de opacidade.
- **"Entendi" depois de marcado:** vira painel com texto e contorno verdes.

### Chips
- **Style:** sans 600 a 14px com algarismos tabulares, fundo de chão, borda de traço forte, pílula, 44px de altura.
- **State:** hover troca a borda para sódio; selecionado (`aria-pressed`) fica com texto e contorno sódio (`--ring`).

### Cards / Containers
- **"Faça agora":** a única caixa com a cor da aula: painel, traço de 1px em sódio (misturado a 70% com o traço), rótulo "Faça agora" em sódio, texto em lead. Sem lavagem de cor, sem halo, sem ponto pulsando.
- **Chamadas ("Por que", "Para guardar"):** traço fino, painel, cantos de 10px, 16px de respiro; o rótulo muda de cor (sinal ou verde), sem ponto.
- **"Em uma frase":** sem caixa: duas réguas de traço forte, rótulo "Em uma frase:" em cor de apoio, frase em lead 550.

### Inputs / Fields
- **Style:** mono 16px (é dado), fundo de poço, borda de traço forte, cantos de 6px, 44px de altura.
- **Focus:** contorno de 2px em sódio. Sliders e checkboxes usam o sódio como `accent-color`.
- **Error:** borda em vermelho (`aria-invalid`).

### Navigation
- **Barra de estado:** status em Atkinson 600 a 15px, botões quadrados de 48px com setas desenhadas, "Quiz" em sans. Aberto, o status ganha `--ring` e o caret vira e fica sódio.
- **Trilha do pacote (signature):** uma estação redonda de 10px por aula, ligadas por trilha pontilhada. Não lida: estação vazia em traço forte. Entendida: estação cheia em tinta. O trecho já percorrido acende em tinta. O **pacote** (retângulo de 14×8, cantos de 2px, sódio; sódio de texto no tema claro) fica na aula atual e anda até a próxima em 700ms quando a pessoa avança. Ao marcar "Entendi", a estação dá um pulinho (escala 1,4 e volta). Com muitas aulas para a largura (menos de 26px por aula), estação e pacote encolhem para 8px e 10×6. Sem risco de escala, sem brilho.
- **Índice:** linhas de 48px separadas por régua, número mono fraco à esquerda; a aula atual em sódio e peso 600; a concluída leva um check verde desenhado.

### Números de destaque (signature)
Dois mostradores desenhados em SVG por `public/shared/readouts.js`, por cima do texto que o widget e o quiz já escrevem; o leitor de tela lê o texto original.
- **7 segmentos** nos widgets: o número que a pessoa está medindo (`.sr-fact b`, ou qualquer elemento com `data-seg7`). Só converte número com unidade curta ("92%", "450/s", "1,5 ms"); hash, nome e texto ficam em sans. Segmento apagado a 8%, inclinação leve, unidade pequena em sans na cor de apoio.
- **Pontos de LED** só na nota do quiz (`.q-score`): "38/46" em matriz 5×7, sódio, pontos apagados a 9%. É o placar; não aparece em outro lugar.
- Quando o mesmo número muda, os segmentos acesos entram em varredura (260ms, coluna por coluna).

### Prancha do widget (signature)
Fundo de chão, traço fino, cantos de 10px, 24px de respiro (16px no celular). Título em sans 600 a 18px, sem ponto. Com o foco dentro, a borda passa a traço forte.

### Figura 3D (signature)
Prancha escura nos dois temas, cantos de 10px, traço fino; no hover, traço forte; com o foco, borda sódio, sem halo. No celular é a prévia com um botão sódio "Abrir a figura 3D". Legenda embaixo em sans: "Figura 3D" (600), dica e "Abrir em tela cheia". O painel dentro da figura segue o site: Atkinson, rótulos em caixa normal na cor de apoio, botões de modo em sans, sem ponto na marca; uma camada no fim do `<style>` de `tools/iso-glow/gallery-3d.html` desfaz a caixa alta e a borda grossa de cada figura regra a regra.

### Flashcards
Lista de linhas tocáveis de 56px entre réguas; a pergunta em Atkinson 600; à direita, o link de texto "Ver resposta" sublinhado, que vira "Esconder" em sódio. A resposta aparece num poço com cantos de 6px.

### Aprofundar
`details` fechado entre réguas, sem caixa; marcador redondo de 22px com mais desenhado que vira menos em sódio quando abre.

### Glossário
Termo com sublinhado pontilhado em traço forte; no hover ou aberto, fica sódio com sublinhado contínuo. A ficha é painel com traço forte, cantos de 10px e `--shadow-pop`, com o nome em 600 a 18px; no celular, vira gaveta embaixo da tela.

### Quiz
Tópicos como cartões com caixa de marcar desenhada (vazia em traço; marcada, cheia em tinta alta com check). Opções como botões de largura total com tecla mono num quadrado de 3px; escolha com `--ring`; certo e errado ganham contorno e um fundo com 12% da cor. Pontuação final como número de destaque (sans 300, até 80px).

## Do's and Don'ts

### Movimento
Todo movimento responde a algo que a pessoa fez; nada se mexe sozinho, nada pulsa, nada entra animado ao rolar. Mola com amortecimento alto (excesso de no máximo ~2%) via a lib Motion (`motion`, nos scripts do Astro) ou `--ease-out`; páginas estáticas (quiz) usam Web Animations. Só `transform`, `opacity` e `clip-path`; altura por `grid-template-rows` 0fr→1fr ou FLIP.
- **O momento principal:** o pacote anda pela trilha até a próxima aula (mola, ~700ms); na home, desce até o módulo onde a pessoa parou e a estação confirma com um respiro.
- **Aula:** a troca no modo foco sai em 110ms e a nova entra em 300ms pelo lado da navegação; o índice abre com recorte e itens em fila curta; o "Aprofundar" anima a altura; a figura 3D troca da prévia para a cena em crossfade e só monta quando a página está ociosa.
- **Respostas curtas:** botão afunda a 0,97 (120ms); o check de "Entendi" se desenha; o título da barra entra de baixo; flashcard e ficha do glossário abrem com recorte a partir de onde foram tocados (no celular a ficha sobe como folha, com mola).
- **Dados:** barras crescem do valor anterior (`scaleX`); o mostrador de 7 segmentos varre só os dígitos que mudaram, depois que o valor assenta.
- **Quiz:** a pergunta sai e a próxima entra da direita; a certa assenta, a errada desloca 3px uma vez; a explicação abre de cima; a tela final chega em sequência curta.
- `prefers-reduced-motion`: tudo vira troca instantânea (ou fade de 120ms).

**A Regra do Pacote.** Só uma coisa anda de um lugar para outro na página: o pacote na trilha. O resto do movimento abre, fecha ou confirma no lugar.

### Do:
- **Do** use `--accent-ink` para texto e traço ativos e `--accent-fill` para preenchimento.
- **Do** marque o ativo com cor e traço de 1px (`--ring` para selecionado).
- **Do** escreva rótulos como texto comum (`.label`: sans 600, 14px, cor de apoio) e guarde a mono (`.data`, `code`) para dado.
- **Do** separe seções com régua de 1px (`--line`) e use `--line-strong` em bordas de controle.
- **Do** dê aos controles pelo menos 44px de altura e 48px aos da barra fixa.
- **Do** desenhe ícones em traço com `currentColor`.
- **Do** confira os dois temas; o tema claro precisa do sódio de texto escurecido.

### Don't:
- **Don't** use `var(--accent)` em CSS novo: o modelo das figuras reescreve esse valor no `<html>`.
- **Don't** use halo de brilho (`box-shadow` colorido sem deslocamento), `--glow` ou `--glow-ring` em CSS novo.
- **Don't** escreva rótulo em caixa alta com entreletra larga, nem ponha ponto antes do rótulo.
- **Don't** ponha tracinho de cor embaixo de título, cantos de mira em pranchas ou numeração 01/02/03.
- **Don't** use mono como fantasia de "técnico" em texto que não é dado.
- **Don't** ponha caixa dentro de caixa nem borda colorida com mais de 1px na lateral.
- **Don't** use sinal, verde ou vermelho como cor de destaque.
- **Don't** use degradê roxo ou azul, nem cartões iguais com ícone em quadradinho sobre o título.
