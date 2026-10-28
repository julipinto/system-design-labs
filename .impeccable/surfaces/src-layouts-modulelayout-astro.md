---
version: 1
slug: "src-layouts-modulelayout-astro"
primary_target: "src/layouts/ModuleLayout.astro"
related_targets: ["src/pages/index.astro","public/labs/databases/quiz/index.html","src/pages/sistema-de-design.astro"]
---

# Superfície: páginas de módulo (aulas), home, quiz e página do sistema de design

Modo: Read. A leitora quer entender uma aula por vez, no celular, e saber onde parou.
Restrições: texto das aulas (MDX) intocado; interior das figuras 3D intocado; withBase, ?embed=1, ?mode= e o comportamento do Figure3D mantidos; sem dependências pesadas.
Direção fixada pelo pedido: combinar com as figuras iso-glow (traço fino, uma cor no que está ativo, fundo escuro). Revisão de 2026-10-28 (pedido "tirar os aspectos de design feito por IA"): sem halo, sem rótulo mono em caixa alta, sem pontinhos, sem cantos de mira, títulos 600; referência de tom: critter atlas (uberdesigner.ai).

## Direction contract
THESIS: o site é a moldura de uma prancha técnica iluminada. A aula é um documento calmo; o que está ativo (aula atual, ação do "Faça agora", figura em foco, cartão aberto) acende na cor de sódio, como as peças das figuras. Recusa o padrão de cartões iguais com ícone, degradê roxo/azul e Inter em tudo.
OWN-WORLD: fundo grafite #121314 (claro: cinza-papel frio #eceded), traços de 1px, tinta fria #c9d0db, destaque sódio #ff9d3c só no estado ativo, como cor e traço de 1px, sem halo; Atkinson Hyperlegible Next no texto, títulos (600) e rótulos (caixa normal); Atkinson Hyperlegible Mono só em dado e código; pranchas de traço fino com cantos de 10px.
STORY: ela abre a aula, vê "Aula 10 de 13" e a barra com o segmento aceso, lê a frase para guardar, faz a ação acesa, mexe na figura, marca "Entendi" e vê o segmento virar concluído.
FIRST VIEWPORT: barra fixa no topo (anterior · aula atual · próxima · quiz) com régua de segmentos; título grande da aula, linha mono "Aula N de T · ~min"; parágrafo-ponte; "Em uma frase" entre réguas; no celular o "Faça agora" começa acima da dobra.
FORM: manual técnico/prancha de figuras (1º da lista), régua de progresso como escala graduada; seed:48ced5766ca94304 (o roll rodou; a direção continua a fixada pelo pedido, que vence o roll).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
