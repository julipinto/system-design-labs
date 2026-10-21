# Fontes: Patterns de Resiliência

Registro dos links de fonte do módulo 21, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Padrões de Resiliência, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/resiliencia/), publicado em 28/05/2025 e citado nas aulas 1 a 13. (`/padroes-de-resiliencia/` dá 404; o endereço certo é `/resiliencia/`.)

**Aulas:** 1 Resiliência em arquitetura · 2 Métricas de disponibilidade · 3 Blast radius · 4 Replicação, balanceamento e healthchecks · 5 Idempotência · 6 Timeouts · 7 Estratégias de retry · 8 Circuit breakers · 9 Fallbacks · 10 Graceful degradation · 11 Backpressure emergencial · 12 Resiliência na camada de dados · 13 Sharding e bulkheads

**Código:** não há `exemplos/` de resiliência no repositório público do autor (conferido com `gh api` em 20/10/2026: as pastas `api-gateway`, `cache`, `cap`, `concurrency-parallelism`, `cqrs`, `databases`, `deployment-methods`, `load-balancing`, `load-test`, `partitioning`, `protocolos-assincronos`, `protocolos-sincronos`, `saga` e `sharding` não têm exemplo de *circuit breaker*, *retry* ou *bulkhead*). Todas as contas e simulações deste módulo foram feitas para o SDLabs.

**Números "medidos":** vêm de scripts em Python (determinísticos; semente 7 quando há sorteio) e de um PostgreSQL 14.24 local, rodados em 20/10/2026: a tabela de noves, série e paralelo, orçamento de erro, *blast radius* (1/N e o `shard-2` a 60%), healthcheck (960 e 225), Lei de Little (30, 60 e 240 em voo; timeout crítico de 1,67 s), amplificação (27 e 810/s), a simulação do *thundering herd* (cinco estratégias), o *circuit breaker* (237 × 3.000 chamadas; abre em 1,3 s, fecha em 93,91 s; 484, 2.260 e 11 recusadas pelo pool nos cenários de timeout), fallback (+R$ 1.260), degradação (1.000 / 1.333 / 1.667), backpressure (250 s, 120 s, 150 s) e *bulkhead* (3,33 s × 1,67 s). A tabela `idempotencia` (`INSERT 0 1`, `INSERT 0 0`, `mesmo_corpo = t` e `f`) saiu do PostgreSQL 14.24. Os widgets do site refazem no navegador a simulação do *breaker* (bate exatamente: 237, 2.763, 1,3 s, 93,91 s, 484, 2.260 e 11) e a da tempestade (as estratégias de intervalo fixo e de *backoff* sem *jitter* batem exatamente; as de *jitter* usam outro gerador de números e variam um pouco: com os controles padrão o widget mostra a tabela medida em Python).

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 34 links distintos desta lista deram 200. Os da AWS (Builders' Library) redirecionam para `builder.aws.com/…`. **Sem link verificável:** Bronson et al., "Metastable Failures in Distributed Systems" (HotOS 2021; o PDF do `sigops.org` não respondeu), e Nygard, *Release It!* (livro). O rascunho do IETF para `Idempotency-Key` está **expirado** desde 18/04/2026.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/resiliencia/) | artigo base | Definição, resiliência × disponibilidade, métricas, *blast radius*, healthchecks, idempotência, timeouts, retries, *circuit breaker*, fallbacks, degradação, *backpressure*, camada de dados, sharding, *bulkhead* e *lease*. As 13 aulas seguem a ordem dele, com 13 correções registradas abaixo. | 1–13 | 200 |
| [AWS: Static stability using Availability Zones](https://aws.amazon.com/builders-library/static-stability-using-availability-zones/) | fonte primária | Projetar para que a falha de uma parte não exija reação imediata. | 1, 3, 12 | 200 |
| [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/) | fonte primária | Falha em cascata e o orçamento de retentativas por processo (60 por minuto). | 1, 6, 7 | 200 |
| [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) | fonte primária | SLI, SLO e o que medir. | 2 | 200 |
| [Google SRE workbook: Implementing SLOs](https://sre.google/workbook/implementing-slos/) | fonte primária | Orçamento de erro na prática. | 2 | 200 |
| [Google SRE: Embracing Risk](https://sre.google/sre-book/embracing-risk/) | fonte primária | Disponibilidade como risco aceito. | 2 | 200 |
| [AWS: Workload isolation using shuffle-sharding](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/) | fonte primária | *Shuffle sharding*: o cliente barulhento derruba só quem tem o mesmo par. | 3, 13 | 200 |
| [AWS: Implementing health checks](https://aws.amazon.com/builders-library/implementing-health-checks/) | fonte primária | Healthcheck raso × profundo e o risco de ejetar tudo. | 4 | 200 |
| [Envoy: health checking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/health_checking) | documentação | Healthcheck ativo e passivo. | 4 | 200 |
| [Envoy: outlier detection](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier) | documentação | Ejeção por erros em sequência. | 4 | 200 |
| [Envoy: panic threshold](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold) | documentação | "The default panic threshold is 50%". | 4 | 200 |
| [Microsoft: Health Endpoint Monitoring](https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring) | padrão | Endpoints de saúde. | 4 | 200 |
| [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests) | documentação | Chaves de até 255 caracteres; removidas depois de pelo menos 24 h; erro se os parâmetros mudam. | 5 | 200 |
| [IETF: rascunho Idempotency-Key](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) | rascunho (expirado) | Cabeçalho como *structured header*; `400`, `422` e `409`. | 5 | 200 |
| [microservices.io: Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html) | padrão | Consumidor que descarta o `evento_id` já processado. | 5 | 200 |
| [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | norma | Métodos idempotentes. | 5 | 200 |
| [AWS: Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) | fonte primária | Falsos *timeouts* de 0,1% → p99,9; *token bucket* no SDK. | 6, 7 | 200 |
| [AWS Architecture Blog: Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) | fonte primária | *Full*, *Equal* e *Decorrelated*; o sem jitter é "o claro perdedor". | 7 | 200 |
| [Microsoft: padrão Retry](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) | padrão | Quando e como repetir. | 7 | 200 |
| [Martin Fowler: CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html) | padrão | Os três estados do disjuntor. | 8 | 200 |
| [Resilience4j: CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker) | biblioteca | Padrões: `failureRateThreshold` 50, `slidingWindowSize` 100, `minimumNumberOfCalls` 100, `waitDurationInOpenState` 60 s, `permittedNumberOfCallsInHalfOpenState` 10, `slowCallDurationThreshold` 60 s. | 8 | 200 |
| [microservices.io: Circuit Breaker](https://microservices.io/patterns/reliability/circuit-breaker.html) | padrão | Um disjuntor por dependência. | 8 | 200 |
| [Microsoft: padrão Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) | padrão | Estados e sondas. | 8 | 200 |
| [AWS: Avoiding fallback in distributed systems](https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/) | fonte primária | "Caminhos exercitados continuamente em vez de raramente": o fallback raro tem defeito latente. | 9 | 200 |
| [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/) | fonte primária | `CRITICAL_PLUS`, `CRITICAL`, `SHEDDABLE_PLUS`, `SHEDDABLE`; limitação adaptativa. | 10, 11 | 200 |
| [AWS: Using load shedding to avoid overload](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/) | fonte primária | Descartar cedo o que menos importa. | 11 | 200 |
| [Reactive Streams](https://www.reactive-streams.org/) | especificação | `request(n)`: o consumidor pede o que aguenta. | 11 | 200 |
| [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585) | norma | Código `429` e `Retry-After`. | 11 | 200 |
| [Microsoft: padrão Throttling](https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling) | padrão | Limitar o ritmo de quem passou da cota. | 11 | 200 |
| [RFC 5861: Stale Content](https://www.rfc-editor.org/rfc/rfc5861) | norma | `stale-if-error` e `stale-while-revalidate`. | 12 | 200 |
| [Microsoft: padrão Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) | padrão | Compartimentos de recurso. | 13 | 200 |
| [Resilience4j: Bulkhead](https://resilience4j.readme.io/docs/bulkhead) | biblioteca | Bulkhead por semáforo ou por pool de threads. | 13 | 200 |
| [Hillside: Leasing (Jain e Kircher)](https://hillside.net/plop/plop2k/proceedings/Jain-Kircher/Jain-Kircher.pdf) | artigo de padrões | Concessão com prazo e renovação. | 13 | 200 |
| [EIP: Lease](https://www.enterpriseintegrationpatterns.com/patterns/conversation/Lease.html) | padrão | O padrão *Lease*. | 13 | 200 |
| Módulos 5, 6, 7, 9, 10, 12, 14, 16, 17 e 18 do SDLabs | interno | Os números de partida (CDN, 210 ms, 15 s, `"recomendado": []`, 27 chamadas, c-7731, HPA, shuffle sharding, RTO e RPO). Sem link. | 1–13 | — |

## Correções ao artigo

1. **Métricas (aula 2).** O artigo diz que no *uptime* o tempo de incidente "é desconsiderado no cálculo" (a fórmula **subtrai** o *downtime*) e trata "erros ÷ tentativas" sem dizer o que conta como erro. Faltam SLO e orçamento de erro, a tabela de noves, série e paralelo e a latência no SLI.
2. **Jitter (aula 7).** O "jitter incremental" (0–4 s, 2–6 s, 6–10 s) não é nenhum dos três algoritmos da AWS. Faltam o teto e o aviso de que o *backoff* sem jitter gera ondas sincronizadas (só 4% concluem no prazo).
3. **Retry imediato (aula 7).** Não "resolve a maior parte dos casos" na falha de dependência: causa a tempestade (45.500 chamadas para 1.000 clientes). Faltam amplificação (27), orçamento, prazo e só idempotente.
4. **Timeouts (aula 6).** Falta como escolher (percentil e Little), o prazo em cadeia e que o *timeout* não cancela o trabalho do outro lado. O timeout de 2 s do módulo 10 foi revisto para 1 s.
5. **Healthchecks (aula 4).** Raso × profundo: o profundo ejeta todas as réplicas, e abaixo de 50% o Envoy entra em pânico.
6. **Circuit breaker (aula 8).** Faltam o que conta como falha (inclusive chamada lenta), janela e mínimo, sondas e um breaker por dependência.
7. **Fallback proativo (aula 9).** Certo e útil; a AWS alerta que fallback raro tem defeito latente e pode piorar a falha.
8. **Graceful degradation × fallback (aula 10).** A diferença é o que se sacrifica (funcionalidade × caminho); faltam prioridade e histerese.
9. **Backpressure (aula 11).** "Enfileirar em memória" sem limite esconde a sobrecarga; backpressure exige fila limitada e sinal. *Rate limiting*, *throttling* e *load shedding* são três coisas.
10. **Blast radius (aula 3).** 1/N só vale com carga uniforme; com o `mkt-01` a 40%, o `shard-2` leva 60% das linhas.
11. **Sharding × bulkhead (aula 13).** O artigo chama o bulkhead de "evolução do sharding"; são eixos diferentes e o *shuffle sharding* liga os dois.
12. **Lease e throttling (aulas 13 e 11).** Estão no artigo e fora da lista de aulas: o *lease* entra como aprofundamento da aula 13; *throttling* e *rate limiting*, na aula 11.
13. **Referências.** NukeMap, Sonrai, Firefly, GeeksforGeeks, botpenguin, TechTarget, o gitbook e boa parte do Medium não entram; entram AWS, Google SRE, Fowler, microservices.io, Microsoft, Resilience4j, Envoy, as RFCs, Hillside e EIP.
