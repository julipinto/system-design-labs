# Fontes: Concorrência e Paralelismo

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Paralelismo, Concorrência e Multithreading, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/concorrencia-paralelismo/), publicado em 01/12/2023 e citado nas aulas 1 a 10.

**Aulas:** 1 Introdução: processos, threads e multithreading · 2 Concorrência · 3 Paralelismo · 4 Paralelismo interno e externo · 5 Concorrência vs paralelismo · 6 Problemas clássicos: deadlocks, starvation e race conditions · 7 Mutex · 8 Mutex distribuído: locks distribuídos · 9 Spinlocks · 10 Semáforos e thread pools

**Código dos laboratórios:** os 8 programas em Go (`concurrency`, `parallelism`, `race_condition`, `mutex`, `mutex_distribuido_redis`, `mutex_distribuido_zookeeper`, `spinlock`, `semaphore`) foram lidos com `gh api` no repositório público de exemplos do autor, pasta `exemplos/concurrency-parallelism/`, e entram sem alteração, com os números de linha acrescentados, nas seções "Aprofundar" das aulas 2, 3, 6, 7, 8, 9 e 10. O link citado ao leitor é o do código de exemplo do próprio artigo (`system-design-examples`), que não leva o nome de nenhum curso.

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`): 36 links citados nas aulas (34 nas Fontes e 2 no texto da aula 10), todos com 200. Os dois artigos da ACM (`dl.acm.org/doi/10.1145/1465482.1465560`, Amdahl 1967, e `dl.acm.org/doi/10.1145/356586.356588`, Coffman 1971) devolveram **403** para acesso automatizado; entraram as cópias do Internet Archive, que abrem (200) e trazem o título e o resumo do artigo. Os 16 links das Referências do artigo foram testados: 13 deram 200 (o vídeo do YouTube abre, mas não foi analisado), 1 deu 202 (St. Cloud State, PDF em carga) e 2 deram 403 (Medium). O repositório do laboratório também abriu (200). Só entraram nas Fontes das aulas os que valem como referência técnica; os demais estão na segunda tabela.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis sobre paralelismo, concorrência e multithreading (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/concorrencia-paralelismo/) | artigo base | Base do módulo: processo, thread, concorrência, paralelismo, interno e externo, deadlock, starvation, race condition, LWW, locks pessimista e otimista, mutex, Redis, ZooKeeper, spinlock e semáforo. As 10 aulas seguem a ordem dele, com 13 correções registradas nos Aprofundar. | 1–10 | 200 |
| [Código de exemplo do artigo (system-design-examples, concurrency-parallelism)](https://github.com/msfidelis/system-design-examples/tree/main/concurrency-parallelism) | código público | Os programas em Go do artigo. | 2, 3, 7, 9 | 200 |
| [pthreads(7)](https://man7.org/linux/man-pages/man7/pthreads.7.html) | fonte primária (man page) | Threads POSIX: memória compartilhada entre threads do mesmo processo, pilha por thread. | 1, 2, 3 | 200 |
| [Go: Defer, Panic and Recover](https://go.dev/blog/defer-panic-and-recover) | fonte primária (blog do Go) | Um panic sem recover encerra o programa; o recover só vale num defer da mesma goroutine. | 1 | 200 |
| [Go: FAQ (goroutines)](https://go.dev/doc/faq#goroutines) | fonte primária (FAQ) | Por que goroutines são baratas: pilha pequena que cresce. | 1 | 200 |
| [Go: o modelo de memória](https://go.dev/ref/mem) | fonte primária (especificação) | O que uma goroutine vê da memória que outra escreve. | 1 | 200 |
| [Rob Pike: Concurrency is not parallelism](https://go.dev/blog/waza-talk) | fonte primária (palestra) | Concorrência como estrutura e paralelismo como execução. | 2, 3, 5 | 200 |
| [OSTEP: Concurrency, an introduction](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf) | livro | Threads, escalonamento e a corrida pelo contador compartilhado. | 2, 5 | 200 |
| [Amdahl (1967), cópia no Internet Archive](https://web.archive.org/web/2018/https://dl.acm.org/doi/10.1145/1465482.1465560) | fonte primária (artigo) | A lei de Amdahl: a parte serial limita a aceleração. A ACM devolve 403 para robôs. | 3 | 200 |
| [Go: GOMAXPROCS ciente de containers](https://go.dev/blog/container-aware-gomaxprocs) | fonte primária (blog do Go) | O GOMAXPROCS padrão passou a respeitar o limite de CPU do cgroup no Go 1.25. `runtime.NumCPU()` continua devolvendo as CPUs da máquina. | 3, 5 | 200 |
| [Kubernetes: Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) | documentação | Réplicas de um serviço. | 4 | 200 |
| [Kubernetes: CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) | documentação | `concurrencyPolicy: Forbid` e o aviso de que um CronJob pode criar dois Jobs ou nenhum. | 4 | 200 |
| [Kubernetes: autoscaling horizontal de pods](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) | documentação | Como as réplicas sobem (HPA). | 4 | 200 |
| [Coffman, Elphick e Shoshani (1971), cópia no Internet Archive](https://web.archive.org/web/2020/https://dl.acm.org/doi/10.1145/356586.356588) | fonte primária (artigo) | As 4 condições do deadlock. A ACM devolve 403 para robôs. | 6 | 200 |
| [OSTEP: Common concurrency problems](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf) | livro | Deadlock, condições de corrida e as formas de prevenir. | 6 | 200 |
| [PostgreSQL: parâmetros de travas (deadlock_timeout)](https://www.postgresql.org/docs/current/runtime-config-locks.html) | documentação | `deadlock_timeout`, padrão 1 s, e o detector de ciclos. O código `40P01` (`deadlock_detected`) está no apêndice de códigos de erro. | 6 | 200 |
| [Go: o detector de corridas](https://go.dev/doc/articles/race_detector) | fonte primária | `go run -race`. | 6 | 200 |
| [Kleppmann: Designing Data-Intensive Applications](https://dataintensive.net/) | livro | Last write wins e a falta de confiança em relógios (caps. 5 e 8). | 6 | 200 |
| [Go: pacote sync](https://pkg.go.dev/sync) | fonte primária | `Mutex`, `Lock`, `Unlock`, `TryLock` ("correct uses of TryLock do exist, they are rare") e a frase de que uma goroutine pode travar e outra destravar. | 7 | 200 |
| [PostgreSQL: travas explícitas](https://www.postgresql.org/docs/current/explicit-locking.html) | documentação | `SELECT ... FOR UPDATE` e as travas de linha. | 7 | 200 |
| [OSTEP: Locks](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf) | livro | Mutex, spin locks, test-and-set e compare-and-swap. | 7, 9 | 200 |
| [Redis: SET](https://redis.io/docs/latest/commands/set/) | fonte primária | `NX` e `PX`; a página do `SETNX` marca o comando como obsoleto desde o Redis 2.6.12. | 8 | 200 |
| [Redis: locks distribuídos e Redlock](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) | fonte primária | O padrão de lock, o script Lua de compara-e-apaga e o Redlock. | 8 | 200 |
| [Kleppmann (2016): How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) | fonte primária (artigo) | Lock de eficiência contra lock de correção, fencing token, crítica ao Redlock. | 8 | 200 |
| [Sanfilippo: Is Redlock safe?](http://antirez.com/news/101) | fonte primária (resposta) | A defesa do Redlock pelo autor do Redis. | 8 | 200 |
| [Apache ZooKeeper: receita de lock](https://zookeeper.apache.org/doc/current/recipes.html#sc_recipes_Locks) | fonte primária | Nós efêmeros e sequenciais, observar só o nó anterior, sem "herd effect". | 8 | 200 |
| [Oracle: Using Spinlocks](https://docs.oracle.com/cd/E37838_01/html/E61057/ggecq.html) | referência do artigo | Spinlock em documentação do Solaris. | 9 | 200 |
| [Documentação do kernel Linux: spinlocks](https://www.kernel.org/doc/html/latest/locking/spinlocks.html) | fonte primária | Onde o spinlock vive em kernel. | 9 | 200 |
| [Go: pacote sync/atomic](https://pkg.go.dev/sync/atomic) | fonte primária | `CompareAndSwapInt32`. | 9 | 200 |
| [Dijkstra (1965): EWD123, Cooperating sequential processes](https://www.cs.utexas.edu/~EWD/transcriptions/EWD01xx/EWD123.html) | fonte primária | Semáforos, as operações P e V. | 10 | 200 |
| [Go: golang.org/x/sync/semaphore](https://pkg.go.dev/golang.org/x/sync/semaphore) | referência do artigo | O semáforo ponderado pronto, que o artigo recomenda no lugar do manual. | 10 | 200 |
| [PostgreSQL: max_connections e superuser_reserved_connections](https://www.postgresql.org/docs/current/runtime-config-connection.html) | documentação | `max_connections` (padrão típico de 100) e as 3 conexões reservadas a superusuários (padrão). | 10 | 200 |
| [PostgreSQL wiki: Number of database connections](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections) | documentação | Por que mais conexões não significa mais vazão. | 10 | 200 |
| [PgBouncer](https://www.pgbouncer.org/) | documentação | O pooler de conexões do PostgreSQL. | 10 | 200 |
| [Tomcat: Connector HTTP (maxThreads)](https://tomcat.apache.org/tomcat-10.1-doc/config/http.html) | documentação | `maxThreads`, padrão 200 (link dentro do texto da aula 10). | 10 | 200 |
| [libuv: threadpool](https://docs.libuv.org/en/v1.x/threadpool.html) | documentação | Tamanho padrão do pool: 4 (link dentro do texto da aula 10). | 10 | 200 |

## Outras Referências do artigo (testadas, não citadas nas Fontes)

| Fonte | Status | Observação |
|---|---|---|
| [bsm/redislock](https://github.com/bsm/redislock) | 200 | Biblioteca de lock com Redis que o artigo recomenda; não entrou nas Fontes da aula 8 por causa do limite de 6 links. |
| [Handling Mutexes in Distributed Systems with Redis and Go](https://dev.to/jdvert/handling-mutexes-in-distributed-systems-with-redis-and-go-5g0d) | 200 | Tutorial; mesma ideia do lab do Redis. |
| [O Jantar dos filósofos](https://blog.pantuza.com/artigos/o-jantar-dos-filosofos-problema-de-sincronizacao-em-sistemas-operacionais) | 200 | Problema clássico de deadlock; ficou fora porque a aula 6 usa o caso da loja. |
| [Difference Between Mutex and Semaphore](https://afteracademy.com/blog/difference-between-mutex-and-semaphore-in-operating-system/) | 200 | Apoio para a diferença de posse, aula 10. |
| [Go - Paralelismo e Concorrência (dev.to)](https://dev.to/yanpiing/go-paralelismo-e-concorrencia-4mlo) · [Concorrência e Paralelismo em Go (TabNews)](https://www.tabnews.com.br/lucchesisp/concorrencia-e-paralelismo-com-golang) | 200 | Textos introdutórios em português. |
| [Comunicação de Processos (USP)](https://edisciplinas.usp.br/pluginfile.php/4933938/mod_resource/content/1/Aula%2005%20-%20Comunicacao_so_2019.pdf) · [Comunicação e Sincronismo entre Processos (UFF)](https://www.professores.uff.br/mquinet/wp-content/uploads/sites/42/2017/08/7.pdf) | 200 | Notas de aula de Sistemas Operacionais. |
| Medium (Load Balancing 101; Desvendando a Concorrência e Paralelismo em Go) | 403 | Bloqueiam acesso automatizado. |
| Parallelizing Dijkstra's Algorithm (St. Cloud State) | 202 | PDF sem relação direta com o caso da loja. |
| Palestra GopherCon 2023 (YouTube) | 200 | Vídeo; não analisado. |

## Correções ao artigo e ao brief

Registradas também no "Aprofundar" de cada aula.

1. **Aula 3. Lab com `time.Sleep` mostra espera, não CPU.** O mesmo programa levaria os mesmos 12 s num núcleo só.
2. **Aula 3. `runtime.NumCPU()` no pod.** Lê as CPUs da máquina, não o limite do container (16 num pod de 1 vCPU em nó de 16 núcleos). O `GOMAXPROCS` padrão respeita o limite do cgroup desde o Go 1.25 (conferido no blog do Go); `NumCPU()` não.
3. **Aula 5. "Paralelismo, em geral, é concorrente."** Simplificação: Pike separa estrutura de execução, e há paralelismo sem concorrência (SIMD).
4. **Aula 5. "Concorrência: ordem desconhecida."** A imprevisibilidade vem do escalonador, não da concorrência (um laço com `select` pode ser determinístico).
5. **Aula 6. LWW.** O `event_version < N` é um guarda de versão monótona, não last-write-wins (que decide pelo timestamp e perde escritas com relógios divergentes).
6. **Aula 7. Mutex e "prioridade".** O que o artigo descreve é posse; e no Go o `sync.Mutex` não impõe dono.
7. **Aula 8. Redis do artigo e do lab.** `GET` antes de `SET` não é atômico; valor `"locked"` igual para todos; TTL de 10 s para trabalho de 10 s; sem fencing token; o comando certo é `SET chave token NX PX ttl`; `SETNX` obsoleto desde o Redis 2.6.12 (conferido na página do `SETNX`).
8. **Aula 8. ZooKeeper.** `Exists` antes do `Create` não é atômico; o `timeout=40000` do log é o valor negociado pelo servidor; a receita oficial usa nós sequenciais (conferido na receita de lock).
9. **Aula 8. "Mutex distribuído é mais fácil."** É mais difícil: sem relógio comum, pausas, TTL vencido.
10. **Aula 9. Spinlock do artigo/lab.** O `Gosched()` roda a cada volta do laço, não no `Unlock()`; é um "lock que cede".
11. **Aula 10. Semáforo não é worker pool**, e o semáforo binário difere do mutex pela posse.
12. **Aula 2. O `Println` do lab de concorrência** roda numa goroutine depois do `close`; o programa pode sair antes de imprimi-lo.
13. **Aula 6. Lab de race.** O contador perto de 100 engana (o `Sleep` fica depois do incremento); só o `-race` prova que não há corrida.
14. **Brief, aula 3. Aceleração com 8 núcleos.** O brief dizia 5,8×. A conta com a parte serial de 2 s em 42 s dá 40 ÷ 8 = 5 s + 2 s = 7 s, e 42 ÷ 7 = **6,0×** (com a parte serial arredondada para 4,8% sai 5,99). As aulas, o widget e o quiz usam 6,0×. O teto com infinitos núcleos é 42 ÷ 2 = 21×.
15. **Brief, aula 10. Valor do pedido 1049.** O "Falta saber…" do brief dizia "cobre 94.90 do pedido 1049", mas 94.90 é o valor do 1047/1048 da Lena. O 1049 da Bia vale 79.90 + 9.00 = **88.90**, e a aula usa esse valor.
16. **Brief, aulas 2 e 7. Os 18 ms de espera e os 2 ms de cada consulta.** O brief traz os dois números sem ligá-los. A aula 2 (Aprofundar) explica que os 18 ms são o pedido inteiro esperando o banco (rede, fila no pool, várias consultas), e que o `SELECT` e o `UPDATE` de 2 ms do gato são uma parte disso.
