# Fontes: Event Sourcing

Registro dos links de fonte do módulo 20, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Event Sourcing, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/event-sourcing/), publicado em 21/11/2025 e citado nas aulas 1 a 11.

**Aulas:** 1 Introdução ao Event Sourcing · 2 Persistência tradicional × Event Sourcing · 3 Agregados · 4 Event Store · 5 Event Bus e publishers · 6 Projeções e modelos de leitura · 7 Rehidratação · 8 Snapshotting · 9 Ordem, versão e last-write-wins · 10 Idempotência · 11 Considerações finais

**Código:** não há `exemplos/` de Event Sourcing no repositório do curso (conferido com `gh api` em 20/10/2026). O laboratório é o do próprio autor, citado nas Referências do artigo: [event-source-distributed-ledger](https://github.com/msfidelis/event-source-distributed-ledger) (Go, PostgreSQL, Kafka, ScyllaDB e MongoDB). Os trechos mostrados estão em `src/lab-code/event-sourcing/`, **sem alteração**, com os números de linha do arquivo original (aula 4: `000003` linhas 1 a 20, `000005` 1 a 44 e `transaction/listener.go` 328 a 372; aula 5: `transaction/listener.go` 274 a 298; aula 7: `rehydratate/listener.go` 98 a 118 e 126 a 161; aula 8: `000004` 1 a 14; aula 9: `balance/pkg/scylla/scylla.go` 70 a 90; aula 10: `statement/pkg/mongodb/client.go` 79 a 95 e `statement/listeners/transaction/listener.go` 44 a 55). **Lido, não executado**: tudo o que se afirma do laboratório (publicar depois do commit e só registrar o erro, `MAX(version)` + 1, `isVersionConflict` por igualdade de texto, tabela `snapshots` que nenhum `.go` usa, rehidratação que lê tudo, `UPDATE … IF version < ?`, `_id = movimentacao_id` com o erro 11000 ignorado) vem da leitura (62 arquivos `.go` e `.sql` baixados com `gh api` e conferidos com `grep`).

**Números "medidos":** vêm de um PostgreSQL 14.24 local, rodado em 20/10/2026, com o mesmo desenho do `events`/`append_event` do autor adaptado para a loja (tabela `eventos`, função `append_evento`): o stream `pedido-1047`, os erros `Concurrency conflict`, `eventos_evento_id_key` e `eventos_stream_versao`, a corrida de duas sessões (`Lock / transactionid`), o stream de 1.000.000 de eventos (263 MB, ~263 B por evento; 1.935 · 1.801 · 1.770 ms; com snapshot 13,1 · 19,6 · 12,1 ms) e a chegada fora de ordem. Os milissegundos mudam com a máquina; a forma e as razões não. **Estimativas** marcadas como tais nas aulas: 52,6 GB, 2 h 47 min, a chance de colisão do widget de conflito, o tempo com snapshot fora do caso medido e as linhas de `eventos_processados` (~72,6 milhões em 7 dias, pior caso).

**Conferência feita em 2026-10-20 e repetida em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 18 links desta lista deram 200.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/event-sourcing/) | artigo base | Definição, persistência tradicional × Event Sourcing, agregados, Event Store, Event Bus, projeções (transacional, semissíncrona, assíncrona), rehidratação, snapshot, versionamento e LWW, idempotência. As 11 aulas seguem a ordem dele, com 11 correções abaixo. | 1–11 | 200 |
| [Repositório do autor: event-source-distributed-ledger](https://github.com/msfidelis/event-source-distributed-ledger) | código público | O Event Store em PostgreSQL, a função `append_event`, o `rehydratate`, o saldo no ScyllaDB e o extrato no MongoDB. | 4, 5, 7, 8, 9, 10 | 200 |
| [Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | padrão | A definição do padrão: o estado como consequência de eventos. | 1, 2, 11 | 200 |
| [Fowler: What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) | artigo | Os quatro padrões independentes (event notification, event-carried state transfer, Event Sourcing, CQRS). | 1 | 200 |
| [microservices.io: Event sourcing](https://microservices.io/patterns/data/event-sourcing.html) | padrão | Persistir o estado de uma entidade como sequência de eventos. | 1 | 200 |
| [Microsoft Learn: padrão Event Sourcing](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) | documentação | Eventos imutáveis, compensação por novo evento, snapshots, projeções e quando não usar. | 2, 6, 8, 11 | 200 |
| [Fowler: Domain Event](https://martinfowler.com/eaaDev/DomainEvent.html) | padrão | O evento como registro de algo que já aconteceu no domínio. | 3 | 200 |
| [AWS Prescriptive Guidance: Event sourcing](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing.html) | documentação | O padrão e os seus riscos. | 3 | 200 |
| [Greg Young: CQRS Documents (PDF)](https://cqrs.wordpress.com/wp-content/uploads/2010/11/cqrs_documents.pdf) | fonte primária | Comando, evento e Event Sourcing na origem do CQRS. | 3, 11 | 200 |
| [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) | documentação | `UNIQUE` sobre várias colunas: a trava de versão. | 4 | 200 |
| [Kurrent: documentação](https://docs.kurrent.io/) | documentação | O banco de eventos dedicado (antigo EventStoreDB). | 4 | 200 |
| [Axon Framework: infraestrutura de eventos](https://docs.axoniq.io/axon-framework-reference/4.11/events/infrastructure/) | documentação | Event Bus e Event Store como componentes distintos. | 5 | 200 |
| Módulo 18 do SDLabs (CQRS) | interno | Escrita dupla, CDC e outbox. Sem link. | 5 | — |
| [event-driven.io: Projections and Read Models](https://event-driven.io/en/projections_and_read_models_in_event_driven_architecture/) | artigo | Projeções e modelos de leitura. | 6 | 200 |
| [Axon Framework: versionamento de eventos](https://docs.axoniq.io/axon-framework-reference/4.11/events/event-versioning/) | documentação | Evolução de formato e *upcasting*. | 7 | 200 |
| [ScyllaDB: Lightweight Transactions](https://opensource.docs.scylladb.com/stable/features/lwt.html) | documentação | `UPDATE … IF`: a escrita condicional. | 9 | 200 |
| Módulo 17 do SDLabs (Replicação) | interno | Desvio de relógio de 120 ms e CRDTs. Sem link. | 9 | — |
| [microservices.io: Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html) | padrão | O consumidor que descarta o que já processou. | 10 | 200 |
| [MongoDB: códigos de erro](https://www.mongodb.com/docs/manual/reference/error-codes/) | documentação | O código 11000 (chave duplicada). | 10 | 200 |
| [PostgreSQL: INSERT](https://www.postgresql.org/docs/current/sql-insert.html) | documentação | `ON CONFLICT DO NOTHING` da tabela de processados. | 10 | 200 |

Conferido e não citado: [Fowler: CQRS](https://martinfowler.com/bliki/CQRS.html) (200).

## Referências do artigo que não entraram
Dois textos do Medium (projeções e *event bus* em Go), a Wikipedia (*Event store*), o texto de Israel Aece e o da Microsoft sobre eventos de integração (comunicação entre serviços, não Event Sourcing; responde 200) ficam de fora.

## Correções ao artigo (avisadas nas aulas)
1. **Event Sourcing × CQRS × event-driven (aulas 1 e 6).** O artigo apresenta o Event Sourcing como padrão de sistemas *event-driven* e liga as projeções ao CQRS. Em Fowler são **quatro padrões independentes**; Event Sourcing não exige CQRS nem bus, e o *Event Bus* não é o Event Store.
2. **"Ordem temporal e absoluta" (aula 4).** O Store garante ordem **por stream** (a versão). Ordem global não é exigida nem barata; o `id bigserial` é ordem de inserção.
3. **Event Store em Kafka (aulas 4 e 5).** Para agregados falta anexar só se a versão esperada bater e ler um stream sem varrer a partição; a retenção apaga o que o Store não pode apagar. Kafka serve ao bus.
4. **Concorrência (aula 4).** O artigo cita e não desenvolve: versão esperada + `UNIQUE (stream_id, versao)`. No laboratório a leitura de `MAX(version)` sozinha não é a trava (reproduzido: a sessão B espera em `transactionid` e falha na restrição); o retry é do chamador.
5. **LWW "por timestamp ou version" (aula 9).** O timestamp depende de relógio e o Store nunca faz LWW; a regra vale no consumidor, com versão, só para modelos de último estado. Modelos que somam precisam do `evento_id`.
6. **Publicação "atômica" (aula 5).** O artigo pede e não diz como: é outbox ou CDC (módulo 18). O laboratório publica depois do commit.
7. **Snapshot (aula 8).** Faltam a versão do código que o gerou e o fato de o laboratório ter a tabela e não a ler. A conta "1 milhão, a cada 10.000" dá 100×; o medido com 1.000 dá 1.000× em eventos (~140× em tempo).
8. **"Projections são determinísticas em relação ao estado atual" (aula 6).** São determinísticas em relação à sequência de eventos; por isso são descartáveis.
9. **Imutabilidade (aulas 2, 7 e 11).** Faltam como corrigir (evento de correção), como evoluir o formato (*upcasting*) e o que fazer com dado pessoal (o módulo só avisa; sem fonte verificada).
10. **Auditoria (aulas 4 e 11).** Os eventos dão "o quê e quando"; "quem e por quê" pedem metadados. O `metadata` do laboratório carrega só o `correlationID`.
11. **Referências do artigo.** Ver a seção anterior.
12. **Achados de leitura do laboratório (aulas 4 e 7; lidos, não executados).** `isVersionConflict` compara a mensagem por igualdade exata (sem o nome da restrição); um filtro de data do `rehydratate` que exclui o `ContaCriada` faz o laço pular as movimentações.
13. **Ordem de chegada do brief (aula 9).** O brief lista a chegada `e-501, e-504, e-502, e-502, e-505`, mas com o `e-505` por último o "último a chegar vence" termina em `entregue`. O módulo usa `e-501, e-504, e-505, e-502, e-502`, que produz o `pago`, versão 2 do brief; a regra da versão termina em `entregue`, v4 nas duas ordens.
