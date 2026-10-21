# Judge: módulo 26, Cell-Based Architecture

Passes feitos sobre as 4 aulas (leitura do texto, `grep`, conferência com o brief, os widgets no navegador e o build).

## 1. Voz de IA
- Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "ademais", "não é só/apenas" e travessão: **0 ocorrências** nas aulas.
- Sem resumo no fim de seção. As listas "Por que importa" têm 4 itens; "Como funciona", 4 ou 5.
- Corrigido na revisão: uma frase que eu tinha acrescentado ao brief sobre os testes do módulo 22 (aula 1), o mecanismo do *lock* do `estoque` na queda (aula 1), "Concordo com a AWS" (aula 3, virou "O texto segue a AWS"), a referência solta "o 150 MB acima" (aula 3), um "192%" inventado na aula 4 e o `grão` no gênero errado (aula 2).

## 2. Encadeamento
- Toda aula abre com uma ponte (`p.ponte`) e fecha com um gancho (`p.gancho`) em forma de "Falta saber…".
- Lendo só a primeira e a última frase: o módulo 25 deixou "uma pilha só" (1) → a célula e o veneno de 2³¹ → o que tem dentro (2) → o piso, o estoque e o deploy → como o pedido chega à célula (3) → o roteador, o mapa e o veneno no Kafka → e se a célula cair (4) → passiva, 2PC, folga e *shuffle* → e se for a região de SP inteira (módulo 27).
- A aula 1 liga com o fim do módulo 25 (o gancho da aula 5 do Bulkhead: "o estoque, o pagamentos e o lb-loja são compartilhados"); a aula 4 puxa o módulo 27.

## 3. Consistência de números (texto × widgets × quiz × glossário × brief)
Conferidos: 7.200 × 2.880 tentativas; 150 ms (3 × ~50 ms); 24.000 × 9.600 e 14.400 × 0 eventos; 40 · 33 · 15 · 12%, pior caso 40%, média 25%, eficiência 62,5%, 55% sem o mkt; 52% por região; 1060 (159,80 + 15,00 = 174,80; gato 19 → 17; 2 → 0); alocação 6 · 3 · 2 · 8; tabela de vCPU (14 · 19 · 11 · 9 = 53 × 41; +12, +29,3%; 9 × 32, 3,6×); anéis 0 · 12 · 27 · 60 · 100%; 150 MB; 80,1% · ~20% · 0 (widget: 80,1% e 19,7%); 13 min 20 s; 99,89%; RPO 2,97 · 1,35 · 2,88 · 9,6 (antes 9 e 24); 2PC 24 e 164 ms; 500 · 41,7 · 6,1; 99,9 · 99,8 · 99,7%; folga +100 · 50 · 33,3 · 11,1 · 5,3% e 35 · 46,7 · 52,5 · 63 · 66,5%; Rio 15% → 48% (4,5 → 14,4; 3,2×); *shuffle* 0,526 · 0,0877 · 0,00645 · 2,22 · 16,7% e 190 · 1.140 · 15.504 · 45 · 6; pares `mkt-01` {8,9} · `lena-77` {6,8} · `bia-31` {4,6} · `caio-58` {1,4} · `davi-12` {1,9}. Os widgets reproduzem as saídas no navegador (conferido em 390, 360 e 1280 px, console limpo, sem scroll lateral).
- O widget do roteador usa `murmur3` e dá 80,1% (mod N, 4 → 5) e 19,7% (anel de 100 pontos por célula); o brief mediu 80,1% com SHA-256. A diferença está declarada na aula 3 e nas fontes.

## 4. Pontos que ficaram para o maestro
- Os "Faça agora" usam nomes genéricos de botão (**Pilha**, **Raio**, **Célula**, **Último gato**, **Roteador**, **Assíncrono**, **Shuffle**, **Replicação**); alinhar com a figura `celulas-3d`.
- Cada aula tem **um** marcador: `pilha` (1), `celula` (2), `roteador` (3) e `shuffle` (4). Os modes `raio`, `assincrono` e `replicacao` ficam como botão, citados no "Faça agora".
- A prévia (`labs/cell-based/celulas-3d-previa.webp`) está referenciada na home e ainda não existe; vem com a figura.
- Falta o `import Figure3D` e a troca dos marcadores pelo componente quando a figura existir.
