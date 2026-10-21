# Judge: Scale Cube (módulo 15)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência com quiz, glossário, widgets e brief), seguindo ESCRITA.md e a skill writing-prose-like-a-human. A figura `cubo-3d` ainda não existe: a conferência com ela fica para quando o Opus a entregar (dados do brief, abaixo).

## Voz de IA
- Busca em MDX, glossário, quiz e widgets por "crucial", "fundamental", "vale ressaltar", "vale lembrar", "além disso", "ademais", "em suma", "nesse sentido", "robusto", "alavancar", "ecossistema", "paradigma": zero ocorrências.
- "Não é só X, é Y" e "não apenas": zero. Os contrastes que sobraram são de fato (clonar contra separar, X contra Z).
- Travessões e meias-riscas: zero em todos os arquivos do módulo.
- Nenhuma seção termina resumindo o que acabou de ser dito. Os "E se der errado" terminam no dado (900 ms, 105 ms, 120 pods).
- Corrigido na leitura: "Então o partem em 4 microsserviços" (aula 6) virou "Depois partem a busca em 4 microsserviços".

## Encadeamento
- Todas as aulas abrem com `p.ponte` e fecham com `p.gancho` contendo "Falta saber…": 1→2 (onde o X para), 2→3 (ver o X de verdade), 3→4 (e se as funções são diferentes), 4→5 (quem divide os dados), 5→6 (juntar os três), 6→módulo 16 (partir a tabela de 50 milhões de linhas).
- A aula 1 liga com o fim do módulo 14 pelo gancho de `aula-6-conclusao`: o banco do `pedidos` a 150 pedidos/s e a promessa de um mapa.
- Vocabulário fixo do brief repetido sem sinônimos soltos (clonar, separar por função, separar por dados, roteador, scatter-gather, pod da AKF). Nenhuma marca de curso; "repositório público do autor" no lugar do curso.

## Listas e formato
- "Como funciona" com no máximo 5 itens, encadeados; "Por que importa" com 4; 4 a 6 links por aula nas Fontes (19 distintos, todos 200 em 20/10/2026); 5 flashcards por aula.
- O "Faça agora" é genérico e cita no máximo o nome do cenário (`x-teto`, `loja`) onde o brief tem dois modes para a mesma aula.

## Consistência de números (texto, quiz, glossário, widgets; a figura segue o brief)
- Coordenadas (1,1,1) → (1,9,1) → (10,9,1) → (10,9,3); 9 deployments, **30 pods** hoje e **36** com o Z do `pedidos` (30 − 3 + 9).
- Pedido **1053** (Caio, Rio, 20:05): 1 caneca azul 19,90 + frete 12,00 = 31,90; estoque 38 → 37; cinco serviços, quatro saltos de 5 ms = +20 ms.
- Catálogo: 640 ÷ 10 = 64 req/s; pico de 950 req/s, CPU a 95% → ⌈10 × 95 ÷ 70⌉ = 14 (conferido em `aula-5-formula-de-capacity-hpa` do módulo 14). A linha do brief "dobra o pico de CPU" foi escrita com esses números.
- `pedidos`: 30/s por réplica, 150/s no banco; 3 réplicas = 90/s; a quinta (150/s) encosta no banco e a sexta (180/s) não acrescenta nada; demanda de 200/s: saída 90 (45%), 150 (75%) e 200 (100%, bancos a 44%).
- `mkt-01`: um shard com 60% de 200 = 120/s, 80% do teto de 150; com 250/s o shard quente chega a 150/s e o conjunto usa 250 dos 450 nominais (55,6%). Conexões: 9 réplicas × pool de 10 = 90 por banco, ou 3 × 10 = 30 em pods por shard; `max_connections` = 100.
- vCPU: 10 × 8 = 80 contra 25 (catálogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatórios 4): 55 a menos, 68,75%, cerca de 69%. Serviço por tabela: 1 + 20 = 21 chamadas × 5 ms = 105 ms contra um JOIN de ~2 ms. 10 × 4 × 3 = 120 pods.
- murmur3 (32 bits, seed 0) conferido com os vetores `""` → 0, `"hello"` → 0x248bfa47 e `"The quick brown fox jumps over the lazy dog"` → 0x2e4ff723; com 3 shards: `lena-77` → 1, `bia-31` → 1, `caio-58` → 2, `davi-12` → 0 (e `mkt-01` → 2). O widget `roteador` e a aula 5 usam a mesma função. O widget `cubo-pods` abre em (3, 9, 1) com 200/s e dá 90/s, 30 pods; com Z = 3 dá 200/s.
- O widget `vcpu` dá 80 contra 25 a 10×; a 1× o monolito (8) custa menos que os serviços (16), e o texto do widget diz isso. Esse comportamento vem da suposição de que só o catálogo cresce com o tráfego, avisada na nota do widget.

## Pendências
- A figura `cubo-3d` e o poster `public/labs/scale-cube/cubo-3d-previa.webp` (a home já aponta para ele) são do terminal Opus; o maestro troca os 6 marcadores `{/* FIG:cubo mode=<x> */}` por `<Figure3D …>` (e importa o componente nas aulas) e alinha os nomes de botão dos "Faça agora".
- `package.json` (`build:3d`) fica com o maestro.
- Laboratório da aula 3 não foi aplicado num cluster: rodar em `kind` ou `minikube` e trocar a saída ilustrativa pela real.
