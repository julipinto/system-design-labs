# Fontes: Sharding e Particionamento

Registro dos links de fonte do módulo 16, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Sharding, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/sharding/), publicado em 16/08/2024 e citado nas aulas 1 a 9.

**Aulas:** 1 Introdução e topologia de sharding · 2 Escalabilidade e performance · 3 Sharding keys e hot partitions · 4 Sharding de tabelas · 5 Ranges comuns: datas e tiers · 6 Hashing · 7 Hashing consistente · 8 Gestão de chaves · 9 Shuffle sharding · 10 Exemplo

**Código dos laboratórios:** `exemplos/sharding/` (`hashing`, `hashing-distrib`, `murmur` com `go.mod`, `consistent-hashing-remove`) e `exemplos/partitioning/table.sql`, lidos com `gh api` no repositório público do autor e copiados sem alteração para `src/lab-code/sharding/`; entram com os números de linha do arquivo nas aulas 4, 6, 7 e 10. O artigo cita os quatro programas de `sharding/` como `msfidelis/system-design-examples`.

**Conferência feita em 2026-10-20** (curl com `-L` e `User-Agent: Mozilla/5.0`): os 26 links distintos citados nas aulas deram 200. Conferidos na própria documentação (pelo brief): `DROP TABLE` e `DETACH PARTITION` "far faster than a bulk operation" e sem custo de VACUUM; os módulos das partições de hash precisam ser fatores do próximo maior; 16384 slots e `HASH_SLOT = CRC16(key) mod 16384` no Redis Cluster; 8 instâncias, 56 e 1/1680, e Route 53 com 2048 servidores virtuais e "730 billion" no post da AWS.

**Contas reproduzidas em Python** (não há Go nesta máquina): murmur3, murmur2, FNV-1a, SHA-256 e MD5 batem com os vetores e com as saídas impressas no artigo; o anel de 200 pontos, os slots e o shuffle sharding (240 e 3.868 de 10.000) também. O PostgreSQL 14 foi rodado localmente para os planos, os erros, a partição por hash e os tempos de `DELETE`/`DROP`/`DETACH`. Os widgets do módulo reproduzem os mesmos números em JS (testado em Node).

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis sobre sharding (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/sharding/) | artigo base | Base do módulo: definição, topologias, chaves e hot partitions, ranges, hash, hashing consistente, gestão de chaves e shuffle sharding. 12 correções registradas abaixo. | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 200 |
| [Azure Architecture Center: Sharding pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding) | fonte primária | Sharding pattern: estratégias de lookup, faixa e hash; custo e problemas. | 1, 2 | 200 |
| [Redis Cluster: especificação (16.384 slots)](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) | documentação | Redis Cluster: 16.384 slots, `CRC16(chave) mod 16384`, hash tags, `-MOVED` e `-ASK`. | 1, 8 | 200 |
| [PostgreSQL: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html) | documentação | Particionamento declarativo, poda, `DROP`/`DETACH` mais rápidos que operação em massa e sem custo de VACUUM, mídia mais barata para dado pouco usado. | 1, 4, 5, 10 | 200 |
| [Dean e Barroso: The Tail at Scale (Google Research)](https://research.google/pubs/the-tail-at-scale/) | fonte primária (artigo) | The Tail at Scale: 1 − 0,99^N de cauda e hedged requests. O endereço do CACM responde 403 a robôs e não foi usado. | 2 | 200 |
| [AWS: Shuffle Sharding (a ideia de isolar o cliente que atrapalha)](https://aws.amazon.com/blogs/architecture/shuffle-sharding-massive-and-magical-fault-isolation/) | fonte primária (artigo) | 8 instâncias, "56" e 1/56 (com ordem), 1/1680; o cliente deve tentar todas as instâncias; Route 53 com 2.048 servidores virtuais e "730 billion". | 3, 9 | 200 |
| [Discord: How Discord Stores Trillions of Messages (hot partitions)](https://discord.com/blog/how-discord-stores-trillions-of-messages) | referência do artigo | Discord e hot partitions nas mensagens. | 3 | 200 |
| [DynamoDB: Partitions and data distribution](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html) | documentação | Partições e distribuição de dados no DynamoDB; chave de partição e hot partition. | 3, 8 | 200 |
| [Citus: Choosing a distribution column](https://docs.citusdata.com/en/stable/sharding/data_modeling.html) | documentação | Escolha da coluna de distribuição. | 3 | 200 |
| [Repositório público do autor: exemplos/partitioning](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/partitioning) | código público | `table.sql` (analytics.sales por RANGE): não roda como está, com os dois erros reais. | 4, 10 | 200 |
| [PostgreSQL: postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html) | documentação | Tabela estrangeira como partição: o caminho de partição a shard. | 4 | 200 |
| [PostgreSQL: CREATE TABLE (partições por faixa, lista e hash)](https://www.postgresql.org/docs/current/sql-createtable.html) | documentação | Partições por faixa, lista e hash; os módulos de hash precisam ser fatores do maior. | 4 | 200 |
| [MongoDB: Hashed Sharding (o contraste com as faixas)](https://www.mongodb.com/docs/manual/core/hashed-sharding/) | documentação | Sharding por hash no MongoDB. | 5, 6 | 200 |
| [MongoDB: Ranged Sharding](https://www.mongodb.com/docs/manual/core/ranged-sharding/) | documentação | Sharding por faixa no MongoDB. | 5 | 200 |
| [Repositório público do autor: exemplos/sharding (hashing, hashing-distrib, murmur)](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/sharding) | código público | Os 4 programas: `hashing`, `hashing-distrib`, `murmur` (+ `go.mod`) e `consistent-hashing-remove`. | 6, 7, 10 | 200 |
| [spaolacci/murmur3 (Go)](https://github.com/spaolacci/murmur3) | código público | Biblioteca do lab `murmur/` (v1.1.0); repositório não arquivado, último push em 02/2023. | 6 | 200 |
| [Documentação do Apache Kafka (o particionador com murmur2)](https://kafka.apache.org/documentation/) | documentação | Particionador por chave do Kafka (murmur2), do módulo 13. | 6 | 200 |
| [Go: pacote hash/fnv](https://pkg.go.dev/hash/fnv) | documentação | FNV-1a, uma das 5 funções comparadas. | 6 | 200 |
| [A Fast, Minimal Memory, Consistent Hash Algorithm (Jump Consistent Hash)](https://arxiv.org/abs/1406.2294) | fonte primária (paper) | Jump Consistent Hash (Aprofundar da aula 7). | 7 | 200 |
| [Wikipédia: Consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing) | referência do artigo | Visão geral do hashing consistente. | 7 | 200 |
| [Wikipédia: Rendezvous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing) | referência | Rendezvous hashing (HRW), usado na aula 9 para escolher réplicas. | 7 | 200 |
| [Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) | fonte primária (paper) | Dynamo (SOSP 2007): anel com nós virtuais. | 7 | 200 |
| [MongoDB: Sharding](https://www.mongodb.com/docs/manual/sharding/) | documentação | Visão geral do sharding no MongoDB (chunks). | 8 | 200 |
| [AWS Builders' Library: Workload isolation using shuffle-sharding](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/) | fonte primária | Builders' Library: workload isolation com shuffle sharding. | 9 | 200 |
| [Cortex: Shuffle sharding](https://cortexmetrics.io/docs/guides/shuffle-sharding/) | referência do artigo | Shuffle sharding no Cortex. | 9 | 200 |
| [spaolacci/murmur3 (pkg.go.dev)](https://pkg.go.dev/github.com/spaolacci/murmur3) | código público | Biblioteca do lab `murmur/` (v1.1.0); repositório não arquivado, último push em 02/2023. | 10 | 200 |

## Sem link verificável (citados só por autor, título e ano)
- Karger et al., "Consistent Hashing and Random Trees" (STOC 1997).
- Dean e Barroso, "The Tail at Scale", no CACM (a página do Google Research, acima, é a usada).
- Kleppmann, *Designing Data-Intensive Applications*, cap. 6 (livro).
- O texto do Instagram sobre ids com o shard embutido não respondeu: a ideia entra na aula 8 sem link.
- "Sharding Distributed Databases: A Critical Review" (ResearchGate), referência do artigo que não foi conferida: fica de fora.

## Referências do artigo que ficaram de fora
LinkedIn, dev.to, Medium e sites de glossário (nenhuma é fonte primária). Entraram a documentação (Azure, PostgreSQL, DynamoDB, MongoDB, Redis), o paper do Dynamo, a AWS (Shuffle Sharding) e o Cortex.

## Correções ao artigo-base (todas avisadas nas aulas)
1. **Sharding = particionamento.** O artigo os trata como sinônimos. Particionar é dividir uma tabela dentro de uma instância (poda e retenção, não dá capacidade); shard é cada pedaço num servidor diferente. (Aulas 1 e 4.)
2. **"O hash evita hot partitions."** O hash espalha chaves diferentes, não carga: o `mkt-01` (e os "3 clientes = 50%" do próprio artigo) cai inteiro num shard: 55,6%. (Aula 3.)
3. **"Chaves de particionamento aleatórias."** Espalham, mas perdem a localidade e fazem toda consulta por cliente ser scatter-gather; o sal (`mkt-01#0` a `#7`) é a versão controlada. (Aula 3.)
4. **Código de hash (primeiro exemplo).** `if int(hashInt) < 0 { return -int(hashInt) }` ainda deixa negativo o menor valor de `int64`; e o programa usa `numShards := 3` fixo. (Aulas 6 e 10.)
5. **Comparação de 5 funções de hash.** 41 entradas (38 únicas) em 5 shards: o desvio esperado é 2,56 e as diferenças (6 a 14) são ruído; com 100 mil chaves todas ficam a menos de 2% do ideal. (Aula 6.)
6. **Trecho do MurmurHash incompleto.** Lista 12 nomes e não conta; a saída 7, 8, 9, 8, 7 (= 39) é do repositório. O murmur3 não passa para minúsculas e os outros sim. (Aulas 6 e 10.)
7. **Hashing consistente.** O anel não usa módulo; o código tem só 3 pontos virtuais por shard (o `Shard-00` nasce vazio); "só os dados entre o novo nó e o próximo mudam" vale por ponto virtual. (Aula 7.)
8. **Shuffle sharding.** O artigo o descreve como sharding mais replicação distribuída; a AWS descreve isolamento de requisição e computação, com um subconjunto de instâncias por cliente e o cliente tentando todas. O post conta 56 e 1/1.680 (com ordem); sem ordem são 28 e 70. (Aula 9.)
9. **"Se um nó falhar, os outros shards continuam disponíveis."** Só para as chaves dos outros shards; sem réplicas os dados do shard caído ficam indisponíveis, e a chance de algum shard cair cresce com N (0,10% a 0,30% com 3 shards; 4,88% com 50). (Aulas 1 e 2.)
10. **Segregação computacional.** O artigo a chama de sharding; é isolamento de carga (bulkhead, módulo 25). (Aula 1.)
11. **Faltam no artigo:** resharding online (cópia, CDC e corte), consultas e transações entre shards, índices secundários e ids globais, tail latency, as tabelas particionadas do PostgreSQL (limitação da PK) e produtos que automatizam (Citus, Vitess, MongoDB, DynamoDB, Redis Cluster). (Aulas 2, 4 e 8.)
12. **Divergências dos labs** (aula 10): `table.sql` não cria a tabela nem partições e usa `\c` do `psql`; `hashing-distrib` com 41 entradas e 38 únicas; `murmur` sem minúsculas; `numShards` fixo; anel de 3 pontos sem migração de dados e `panic` no anel vazio; nenhum lab testa com muitas chaves.
