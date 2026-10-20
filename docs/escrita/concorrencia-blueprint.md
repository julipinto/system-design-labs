# Blueprint do módulo 11: Concorrência e Paralelismo

Fase Architect (skill writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md. O agente aprova o próprio blueprint; as decisões ficam registradas no fim. Brief: `docs/escrita/concorrencia-brief.md`.

## Fio condutor do módulo
Resta 1 gato de pelúcia e a Bia e o Caio clicam em comprar com 2 ms de diferença; para várias coisas acontecerem ao mesmo tempo sem uma pisar na outra, o módulo vai de "o que é uma linha de execução" até a trava que vale entre réplicas e o limite de vagas do banco.

## Tese de cada aula e a pergunta que deixa para a próxima

| # | Aula | Tese (1 frase) | Pergunta que deixa |
|---|---|---|---|
| 1 | Introdução: processos, threads e multithreading | A `estoque-1` é um processo e suas threads (goroutines) dividem a memória: isso as deixa baratas e as faz cair juntas num `panic`. | Se o núcleo executa uma coisa por vez, por que 200 pedidos andando juntos rendem mais? |
| 2 | Concorrência | Com 2 ms de CPU e 18 ms de espera, intercalar pedidos leva o `estoque-1` de 50 para 500 req/s com 1 vCPU; só rende para quem espera. | E o `relatorios`, que só calcula e não espera ninguém? |
| 3 | Paralelismo | Dividir o cálculo em 4 fatias em 4 núcleos leva o fechamento de 42 s a 12 s (3,5×), e a parte serial limita o ganho (Amdahl). | Onde mora esse paralelismo: dentro de um processo ou entre vários? |
| 4 | Paralelismo interno e externo | Interno são threads que dividem memória; externo são processos com memórias separadas, e na passagem de um para o outro a coordenação deixa de ser em memória. | Qual é, afinal, a diferença entre concorrência e paralelismo? |
| 5 | Concorrência vs paralelismo | Concorrência é estrutura e paralelismo é execução (Pike); o quadro 2×2 classifica `estoque-1`, `relatorios`, réplicas e um programa de um pedido só. | O que acontece quando partes que rodam juntas mexem no mesmo dado? |
| 6 | Problemas clássicos | Sem coordenação, a Bia e o Caio levam o estoque a −1 (4 de 6 ordens); a trava que conserta isso traz deadlock e starvation, e os eventos têm a sua corrida. | Como uma trava só, no lugar certo, fecha a janela de 2 ms? |
| 7 | Mutex | Um `sync.Mutex` em volta de `reservar` faz o Caio esperar 2 ms e levar 409; custa 250 reservas/s, e o banco tem uma alternativa otimista. | E quando a Black Friday sobe a segunda réplica e cada uma tem o seu mutex? |
| 8 | Mutex distribuído | A trava vai para o Redis (`SET NX PX`), mas o TTL pode vencer com o dono parado; fencing token ou `UPDATE ... AND quantidade > 0` fecham o buraco. | E se a espera pela trava for tão curta que dormir custa mais que esperar? |
| 9 | Spinlocks | Girar com compare-and-swap só compensa em seções menores que o custo de dormir; em 5 ms de banco queima 87,5% da CPU de um nó de 8 núcleos. | Como deixar entrar não um, mas dez de cada vez, com o banco aceitando um número fixo de conexões? |
| 10 | Semáforos e thread pools | O pool de 10 conexões é um semáforo (500/s × 20 ms = 10); 200 pedidos esperam em 20 lotes, e 12 réplicas × 10 = 120 passam das 100 conexões do banco. | Como o `pedidos` diz ao `pagamentos` "cobre 88.90 do pedido 1049"? (módulo 12) |

## Decisões
1. **Uma figura por aula, no máximo.** A1 `threads mode=processo`, A2 `threads mode=um-nucleo`, A3 `threads mode=quatro-nucleos`, A4 `threads mode=interno-externo`, A5 `threads mode=um-nucleo` (o "Faça agora" manda apertar o botão de quatro núcleos para o segundo caso), A6 `estoque mode=race` (o "Faça agora" manda apertar o botão do deadlock), A7 `estoque mode=mutex` (botão do modo condicional), A8 `estoque mode=replicas` (botões redis e ttl), A9 `threads mode=spin`, A10 `threads mode=pool` (botão de conexões). Os marcadores são `{/* FIG:<nome> mode=<x> */}`; os nomes dos botões nos "Faça agora" são genéricos e o maestro os alinha com a figura.
2. **A loja é o caso principal; o churrasco entra como ponte curta.** Aparece como conta nas aulas 2 (23 s → 7 s) e 3 (49 s → 12 s) e, nas demais, só pelo código dos laboratórios.
3. **O código dos 8 laboratórios entra inteiro, com números de linha, no Aprofundar** (aulas 2, 3, 6, 7, 8, 9, 10). O código da loja (`reservar` com bug, com mutex, o SQL do pessimista e do otimista, o `SET NX`, o guarda de versão) fica no corpo da aula.
4. **Cinco widgets**, um por conta que a figura sozinha não deixa mexer: `amdahl` (A3), `corrida` e `deadlock` (A6), `ttl` (A8), `pool` (A10).
5. **Cada aula tem "E se der errado"**: A1 `panic` derruba o processo, A2 20 ms de CPU (teto 50/s), A3 fatia por quantidade (12 s contra 6,1 s) e o aviso do `Sleep`, A4 fechamento duplicado nas duas réplicas, A5 4 threads em 1 vCPU (40 s), A6 deadlock com ordem cruzada, A7 `defer` esquecido e seção grande, A8 TTL vencido e a pausa de 6 s, A9 87,5% de CPU, A10 12 réplicas × 10 = 120 conexões.
6. **Correções ao artigo** registradas no "Aprofundar" de cada aula (13) e em `docs/fontes/concorrencia.md`, junto com três ajustes ao próprio brief.
7. **Ajustes ao brief** (avisados no relatório e em `docs/fontes/concorrencia.md`): (a) a aceleração com 8 núcleos é 6,0×, e não 5,8× (42 ÷ 7); (b) o "Falta saber…" da aula 10 usa o valor do pedido 1049, 88.90, em vez de 94.90, que é o da Lena; (c) os 18 ms de espera do pedido e os 2 ms de cada consulta (aula 2, Aprofundar) são ligados numa frase.
8. **Números derivados ou conferidos além do brief** (avisados como exemplo ou citados da fonte): 0,1 ms por linha do `relatorios` (40 s ÷ 400 mil); instante ≈ 5,008 s em que o Caio termina de comprar (aula 8); 3 conexões reservadas a superusuários, de modo que 12 × 8 = 96 cabe nas 97 restantes (documentação do PostgreSQL); Tomcat com 200 threads e libuv com 4 (documentação).

## Vocabulário fixo (repetir, não sinonimizar)
processo, thread, goroutine, núcleo, concorrência, paralelismo, paralelismo interno, paralelismo externo, troca de contexto, condição de corrida (race condition), seção crítica, mutex, trava (lock), lock distribuído, TTL, fencing token, deadlock, starvation, spinlock, semáforo, worker pool, pool de conexões, lock pessimista, lock otimista.

## Decisões da fase Carpenter
- Toda aula abre com ponte pelo problema aberto e fecha com "Falta saber…" antes dos flashcards (lendo só a primeira e a última frase, a história se conta: processo → espera → cálculo → onde → o que separa → o último gato → a trava → entre réplicas → girar → vagas → próximo módulo).
- As listas de "Como funciona" têm no máximo 5 itens e se chamam pelo dado ("Com N pedidos em andamento…", "O custo mudou…").
- Seções do meio da aula 6 (deadlock, starvation, eventos) começam pelo caso da loja e só então dão o nome técnico.
