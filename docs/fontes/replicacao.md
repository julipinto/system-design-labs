# Fontes: Replicação de Dados

Registro dos links de fonte do módulo 17, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Replicação de Dados, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/replicacao/), publicado em 25/09/2024 e citado nas aulas 1 a 6.

**Aulas:** 1 Introdução à replicação de dados · 2 Modelos: Primary/Replica e Primary/Primary · 3 Síncrona, assíncrona, semi-síncrona e por logs · 4 Event-Carried State Transfer · 5 CDC: Change Data Capture · 6 CRDTs

**Código:** o repositório público do autor (pasta `exemplos/`, conferida com `gh api`) **não tem lab de replicação de banco**. O que existe e entra na aula 5 é o conector `exemplos/cqrs/hospital-cqrs-cdc/debezium/postgres-connector.json` (PostgreSQL 16 com `wal_level=logical`, Kafka, Debezium 3.0.0.Final), que é o lab do módulo 18 (CQRS); o arquivo está em `src/lab-code/replicacao/postgres-connector.json`, sem alteração. As aulas 2 e 3 usam um **laboratório do SDLabs** (três instâncias de PostgreSQL 14 com replicação em streaming, em `src/lab-code/replicacao/replicacao-lab.sh`), e a aula 5 usa o `test_decoding` numa tabela `pedidos_cdc`. Todas as saídas "reais" do módulo (erro de `INSERT` na réplica, `pg_stat_replication`, LSN, `SyncRep`, timeline 1 → 2, `test_decoding`, 335 bytes de WAL por pedido, 6.552 kB retidos no slot) vêm de uma execução de 20/10/2026 no PostgreSQL 14. As contas dos CRDTs (273, −1, `{gato}`, 120 permutações), o LWW com relógio de −120 ms e o tamanho dos eventos (202 B e 56 B) foram refeitos em Python e batem com os widgets. Não foi testada a alternativa com Docker (`postgres:16`): a máquina não tem Docker.

**Conferência feita em 2026-10-20** (curl com `-L` e `User-Agent` de navegador): os 28 links distintos citados nas aulas deram 200. Os papers de Shapiro de 2011 (HAL) respondem 200 atrás de uma verificação anti-robô e não são citados nas aulas; o link usado é o do arXiv (2018). O endereço equivalente do MySQL para a semi-síncrona responde 403 a robôs e não é usado: a aula cita o do MariaDB. Sem link verificável: Terry et al., "Session Guarantees for Weakly Consistent Replicated Data" (1994), Kleppmann, *DDIA*, cap. 5, e o PDF direto do paper de CRDTs de 2011.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/replicacao/) | artigo base | Chaves de reserva, modelos Primary/Replica e Primary/Primary, estratégias (total, parcial, síncrona, assíncrona, semi-síncrona, logs), ECST, CDC e CRDTs. As 6 aulas seguem a ordem dele, com 11 correções registradas abaixo. | 1–6 | 200 |
| [PostgreSQL: High Availability, Load Balancing, and Replication](https://www.postgresql.org/docs/current/high-availability.html) | documentação | Visão geral da replicação no PostgreSQL. | 1 | 200 |
| [PostgreSQL: Comparison of Different Solutions](https://www.postgresql.org/docs/current/different-replication-solutions.html) | documentação | Primário e réplica, sincronia e atraso entre as soluções. | 1 | 200 |
| [Vogels: Eventually Consistent](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html) | fonte primária | *Read-your-writes*, *monotonic reads*, *session consistency*. | 1, 3 | 200 |
| [PostgreSQL: Log-Shipping Standby Servers](https://www.postgresql.org/docs/current/warm-standby.html) | documentação | Replicação em streaming, `primary_conninfo`, `standby.signal`, promoção. | 2 | 200 |
| [PostgreSQL: Hot Standby](https://www.postgresql.org/docs/current/hot-standby.html) | documentação | A réplica aceita só leitura (`cannot execute INSERT in a read-only transaction`). | 2 | 200 |
| [PostgreSQL: pg_rewind](https://www.postgresql.org/docs/current/app-pgrewind.html) | documentação | Como o primário antigo volta como réplica. | 2 | 200 |
| [Patroni: configuração dinâmica](https://patroni.readthedocs.io/en/latest/dynamic_configuration.html) | documentação | `ttl` 30, `loop_wait` 10, `retry_timeout` 10, `maximum_lag_on_failover`. | 2 | 200 |
| [Raft: In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf) | fonte primária | Voto só para log igual ou mais atualizado; tempos de eleição sorteados (por exemplo, 150 a 300 ms). | 2 | 200 |
| [PostgreSQL: Write Ahead Log (configuração)](https://www.postgresql.org/docs/current/runtime-config-wal.html) | documentação | `synchronous_commit`: `off`, `local`, `remote_write`, `on` (padrão), `remote_apply`. | 3 | 200 |
| [PostgreSQL: funções de administração](https://www.postgresql.org/docs/current/functions-admin.html) | documentação | `pg_wal_replay_pause`, `pg_last_wal_replay_lsn`, `pg_current_wal_lsn`. | 3 | 200 |
| [MariaDB: Semisynchronous Replication](https://mariadb.com/kb/en/semisynchronous-replication/) | documentação | Depois do `rpl_semi_sync_master_timeout` (10.000 ms) o primário reverte para assíncrona. | 3 | 200 |
| [Fowler: Write-Ahead Log](https://martinfowler.com/articles/patterns-of-distributed-systems/write-ahead-log.html) | padrão | O log antes da aplicação. | 3 | 200 |
| [Fowler: Two-Phase Commit](https://martinfowler.com/articles/patterns-of-distributed-systems/two-phase-commit.html) | padrão | O tema certo do 2PC, que não é a replicação síncrona. | 3 | 200 |
| [Fowler: What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) | fonte primária | Os quatro padrões; *event-carried state transfer* é um deles. | 4 | 200 |
| [Kafka: configuração de tópico](https://kafka.apache.org/40/generated/topic_config.html) | documentação | `cleanup.policy=compact` guarda o último valor de cada chave. | 4 | 200 |
| [PostgreSQL: test_decoding](https://www.postgresql.org/docs/current/test-decoding.html) | documentação | O formato `table …: INSERT/UPDATE/DELETE`, com `old-key` e `new-tuple` em `REPLICA IDENTITY FULL`. | 5 | 200 |
| [PostgreSQL: Replication (configuração)](https://www.postgresql.org/docs/current/runtime-config-replication.html) | documentação | `max_slot_wal_keep_size` (padrão −1) e `synchronous_standby_names`. | 5 | 200 |
| [Debezium: conector do PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html) | documentação | Nome do tópico, `before` só com a chave na identidade padrão, `op` `r`, "WAL disk space consumption". | 5 | 200 |
| [Repositório do autor: exemplos/cqrs/hospital-cqrs-cdc](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/cqrs/hospital-cqrs-cdc) | código público | O `postgres-connector.json` do Debezium. | 5 | 200 |
| [microservices.io: Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html) | padrão | O outbox. | 5 | 200 |
| [Shapiro et al.: CRDTs (arXiv 2018)](https://arxiv.org/abs/1805.06358) | fonte primária | CvRDT e CmRDT, junção como semirreticulado. | 6 | 200 |
| [crdt.tech](https://crdt.tech/) | referência | O que são CRDTs e onde se usam. | 6 | 200 |
| [Kleppmann: CRDTs, The Hard Parts](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html) | palestra e texto | Metadados que crescem (*tombstones*). | 6 | 200 |
| [Riak: tipos de dados CRDT](https://docs.riak.com/riak/kv/latest/learn/concepts/crdts/index.html) | documentação | CRDTs em produção. | 6 | 200 |
| [Redis: bancos Active-Active](https://redis.io/docs/latest/operate/rs/databases/active-active/) | documentação | CRDTs em produção. | 6 | 200 |
| [Automerge](https://github.com/automerge/automerge) · [Yjs](https://yjs.dev/) | código público | Edição colaborativa com CRDTs. | 6 | 200 |

## Referências do artigo que não entraram
ManageEngine, Qlik e Triggo (sobre CDC), SQL Server CDC, os textos de Rivery, Estuary, dev.to, Medium e Graham Brooks sobre *Event-Carried State Transfer*, "Replication Strategies and Partitioning in Cassandra" (Baeldung) e "A Gentle Introduction to CRDTs" (vlcn.io) ficam de fora: a documentação do PostgreSQL, do MariaDB e do Debezium, os textos de Fowler e Vogels e os papers de CRDT e de Raft cobrem o conteúdo com fonte primária. Do artigo ficam também os links de Paxos, Raft, Viewstamped Replication, etcd, Consul e CockroachDB (consenso), que não são citados nas aulas. Consultados e não citados: Fowler, *Leader and Followers*, e o paper do Dynamo (vetores de versão).

## Correções ao artigo (avisadas nas aulas)
1. **Síncrona e 2PC (aula 3).** A síncrona real espera o ack de réplicas escolhidas (`FIRST n` ou `ANY n`, nível configurável), sem 2PC; o 2PC coordena uma transação e bloqueia se o coordenador cai. "Consistência forte" exige também ler de um nó em dia (`remote_apply`).
2. **Assíncrona (aula 3).** Falta mostrar o caso da Lena sem o próprio pedido (*read-your-writes*) e como consertar (token de LSN, ler do primário por um tempo, `remote_apply`).
3. **Semi-síncrona (aula 3).** Depois do `rpl_semi_sync_master_timeout` (10.000 ms) o MariaDB volta a ser assíncrono; o PostgreSQL espera.
4. **Primary/Replica (aula 2).** A consistência nas réplicas é eventual (a réplica fica atrás), e o primário é ponto único de falha só até a eleição; faltam fencing e split brain.
5. **Primary/Primary (aula 2).** Troca o ponto único de falha por conflito de escrita; o LWW perde escritas e depende de relógio (120 ms). Alternativas: vetor de versão, CRDTs ou um dono por registro.
6. **Replicação por logs (aula 3).** O ganho principal é a ordem e o determinismo; Paxos, Raft e Viewstamped Replication replicam um log para consenso, e o Kafka replica a partição por ISR.
7. **ECST (aula 4).** É um dos quatro padrões de "event-driven" de Fowler; o custo é armazenamento, consistência eventual e ordem; falta `versao` no evento e o tópico compactado.
8. **CDC "em tempo real" (aula 5).** Por log, ms a segundos; por consulta periódica perde intermediárias e deleções; faltam `REPLICA IDENTITY`, o slot e o outbox.
9. **CRDTs (aula 6).** Garantem convergência, não sentido de negócio (estoque −1); o exemplo de editar a mesma linha de texto exige CRDTs de sequência; as propriedades são da junção.
10. **Replicação total e parcial (aula 1).** A total também multiplica a escrita; a parcial depende de sharding.
11. **Referências (aula 1).** Ver a seção anterior.
