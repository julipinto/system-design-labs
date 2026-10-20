# Judge: Concorrência e Paralelismo (módulo 11)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência com figura, quiz, glossário e widgets), seguindo ESCRITA.md.

## Voz de IA
- Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "não é só X, é Y", "ademais", "vale lembrar", "nesse sentido": uma ocorrência de "Além disso" (aula 8, Aprofundar), trocada por "O valor também é…". Travessões e meias-riscas: zero nas 10 aulas.
- Os "e não X" que sobraram são contrastes de fato (3,5× e não 4×; posse e não prioridade), sem a forma "não é só X, é Y".
- Nenhuma seção termina resumindo o que acabou de ser dito. A aula 2 mantém uma frase-dobradiça curta antes de "Por que importa" porque ela liga ao paralelismo; "Por que importa" tem 4 itens em todas as aulas.

## Encadeamento
- Todas as aulas abrem com ponte e fecham com "Falta saber…": 1→2 (por que 200 pedidos rendem mais), 2→3 (o cálculo sem espera), 3→4 (onde mora o paralelismo), 4→5 (a diferença entre os dois conceitos), 5→6 (o dado compartilhado), 6→7 (a trava só), 7→8 (a segunda réplica), 8→9 (esperar sem dormir), 9→10 (dez vagas em vez de uma), 10→módulo 12 (REST/JSON contra gRPC/Protobuf).
- A aula 1 liga com o fim do módulo 10 ("Falta saber como um programa faz várias coisas ao mesmo tempo sem uma pisar na outra") e retoma `estoque` e o pedido 1048 da Lena.
- Vocabulário fixo repetido (goroutine, mutex, trava, deadlock, starvation, fencing token), sem sinônimos soltos.

## Consistência de números (texto, quiz, glossário, widgets; a figura segue o brief)
- 2 ms de CPU + 18 ms de espera = 20 ms; 50 → 500 req/s; N = 10; 20 ms de CPU → teto 50/s. Churrasco: 23 s → 7 s; 49 s → 12 s (4,1×, 51%); ideal 6,1 s.
- Relatório: 400 mil linhas, 40 s + 2 s = 42 s, 4 fatias: 10 s + 2 s = 12 s, 3,5× (4 núcleos); **6,0× com 8 núcleos**; teto 21×. O widget `amdahl` usa 2/42 como parte serial padrão (4,76%, exibida como 4,8%) e dá 3,5×, 6,0× e 21,0× exatamente.
- Corrida: t = 0, 2, 4, 6 ms; janela de 2 ms; 4 de 6 ordens dão −1 (o widget `corrida` enumera as 6 e a versão com mutex as 2 seguras); pedido 1049 = 79.90 + 9.00 = 88.90.
- Mutex: espera 2 ms, 409 em t = 6 ms; seção de 4 ms → 250/s; lab de 100 × 100 ms = 10 s.
- Redis: SET OK em 1 ms, `nil` em 3 ms, solta em 6 ms, tentativa em 53 ms, 409 em ≈ 56 ms; ciclo de 6 ms → 166/s; TTL 5 s com pausa de 6 s: vence em 5,001 s, Caio pega em 5,003 s, Bia acorda em 6 s e leva −1; fencing 33 e 34 (o widget `ttl` reproduz esses instantes com os padrões 5 s e 6 s).
- Spinlock: 7 de 8 núcleos = 87,5%; 10 amigos × 1 s = 10 s.
- Pool: 500/s × 20 ms = 10; 20 lotes, último 400 ms, média 210 ms (o widget `pool` dá 400 e 210 nos padrões); 12 × 10 = 120 > 100; 12 × 8 = 96; semáforo do lab: ⌈10 ÷ 3⌉ = 4 ondas × 2 s = 8 s.
- **Divergências do brief resolvidas**: (a) 5,8× → 6,0× com 8 núcleos; (b) 94.90 → 88.90 no gancho da aula 10; (c) a espera de 18 ms por pedido (aula 2) e as consultas de 2 ms (aulas 6 e 7) foram ligadas numa frase do Aprofundar da aula 2.
- O brief pede ordens do Caio em "t=2" para o `SELECT` e "o pedido do Caio também seria criado" na corrida: a aula não dá número ao pedido do Caio (1050 é do Davi no módulo 12).

## Correções ao artigo-base (todas registradas no "Aprofundar" de cada aula)
1. A2: o `Println` do lab de concorrência pode não imprimir. 2. A3: o lab com `Sleep` mostra espera, não CPU; `runtime.NumCPU()` no pod. 3. A5: "paralelismo é concorrente" e "ordem desconhecida". 4. A6: LWW contra guarda de versão; o contador do lab de race engana. 5. A7: mutex e posse. 6. A8: Redis (4 problemas, `SET NX PX`), ZooKeeper, "mutex distribuído é mais fácil". 7. A9: o `Gosched` não está no `Unlock`. 8. A10: semáforo não é worker pool.

## Links
36 links citados, todos 200 (ver `docs/fontes/concorrencia.md`). Os dois artigos da ACM (Amdahl 1967 e Coffman 1971) deram 403 a robôs e foram trocados pelas cópias do Internet Archive, que abrem.

## Pendências
- As 2 figuras 3D (`estoque-3d` e `threads-3d`) e o poster `public/labs/concorrencia/estoque-3d-previa.webp` (usado no card da home) são do terminal de figuras; o maestro troca os marcadores `{/* FIG:… */}` por `<Figure3D …>` e põe `build.mjs` no `build:3d` do `package.json`.
- Os nomes dos botões nos "Faça agora" são genéricos (Processo, Um núcleo, Quatro núcleos, Interno e externo, Spin, Pool, Conexões, Race, Mutex, Condicional, Réplicas, Redis, TTL, Deadlock) e precisam ser alinhados com os rótulos finais da figura.
