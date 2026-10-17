# Fontes: Databases, Modelos de Dados e Indexação

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [Databases, Modelos de Dados e Indexação, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/databases/), citada nas aulas 1 a 15.

**Aulas:** 1 O que é um banco · 2 Tipos de bancos · 3 Níveis de consistência · 4 Modelo de tuplas · 5 Modelo de documentos · 6 Modelo colunar · 7 Coluna larga · 8 Chave-valor · 9 Grafos · 10 Page size e indexação colunar · 11 LSM-Trees · 12 B-Tree · 13 Hashing · 14 Índices invertidos · 15 Escrita e leitura intensivas

Conferência feita em 2026-10-17 (curl com `-L` e `User-Agent: Mozilla/5.0`, segunda tentativa com tempo maior): 82 links testados (29 do artigo e do blog, incluindo os 21 das Referências, e 53 candidatos de fonte primária e documentação). Os 49 links citados nas aulas abrem com 200.

**Sobre a contagem:** o brief falava em 37 links nas Referências. O artigo tem **21** (a seção "Referências" da página); os outros links do corpo do texto são artigos do próprio blog (storage, teorema-cap, sharding, replicação, caching, CQRS, performance, monolitos, protocolos, padrões de comunicação, que não são referências externas).

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Databases, Modelos de Dados e Indexação, Matheus Fidelis](https://fidelissauro.dev/databases/) | artigo base | Base do módulo: as 15 aulas seguem a ordem dele, com as correções listadas abaixo. | 1 a 15 | 200 |
| [Codd (1970): A Relational Model of Data for Large Shared Data Banks](https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf) | referência do artigo (fonte primária) | O artigo que propõe o modelo relacional. | 1, 2, 4 | 200 |
| [Kleppmann: Designing Data-Intensive Applications](https://dataintensive.net/) | outro (livro) | Referência geral de armazenamento, índices e consistência. | 1 | 200 |
| [dev.to: NoSQL, NewSQL e SQL distribuído](https://dev.to/ankitmalikg/nosql-vs-newsql-vs-distributed-sql-a-comprehensive-comparison-lm7) | referência do artigo | Comparação dos três tipos de banco, apoio à aula 2. | 2 | 200 |
| [Wikipedia: NewSQL](https://en.wikipedia.org/wiki/NewSQL) | outro | Definição do NewSQL. | 2 | 200 |
| [Wikipedia: banco em memória](https://en.wikipedia.org/wiki/In-memory_database) | outro | Definição e trade-offs de bancos em memória. | 2 | 200 |
| [Wikipedia: banco de séries temporais](https://en.wikipedia.org/wiki/Time_series_database) | outro | Definição de TSDB. | 2 | 200 |
| [Wikipedia: linearizabilidade](https://en.wikipedia.org/wiki/Linearizability) | outro | Define a consistência forte com precisão; base da correção da aula 3. | 3 | 200 |
| [Wikipedia: consistência sequencial](https://en.wikipedia.org/wiki/Sequential_consistency) | referência do artigo | Mostra que sequential consistency é mais fraca que linearizabilidade. | 3 | 200 |
| [Wikipedia: modelos de consistência](https://en.wikipedia.org/wiki/Consistency_model) | outro | A escada de modelos entre forte e eventual. | 3 | 200 |
| [Wikipedia: consistência eventual](https://en.wikipedia.org/wiki/Eventual_consistency) | outro | Definição de consistência eventual. | 3 | 200 |
| [crdt.tech: o que são CRDTs](https://crdt.tech/) | referência do artigo | Estruturas que juntam versões sem conflito. | 3 | 200 |
| [PostgreSQL: layout de página](https://www.postgresql.org/docs/current/storage-page-layout.html) | documentação | Página de 8 KB, fixada na compilação. | 4, 10 | 200 |
| [Microsoft: páginas e extensões do SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/pages-and-extents-architecture-guide?view=sql-server-ver17) | referência do artigo | Página de 8 KB no SQL Server. | 4, 10 | 200 |
| [MongoDB: introdução à modelagem de dados](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/) | documentação | Embutir x referenciar documentos. | 5 | 200 |
| [MongoDB: tipos de índice](https://www.mongodb.com/docs/manual/core/indexes/index-types/) | documentação | Mostra que o MongoDB indexa campos com B-Tree (correção da aula 5). | 5 | 200 |
| [Wikipedia: banco orientado a documentos](https://en.wikipedia.org/wiki/Document-oriented_database) | outro | Definição do modelo. | 5 | 200 |
| [Microsoft: índices columnstore](https://learn.microsoft.com/pt-br/sql/relational-databases/indexes/columnstore-indexes-overview?view=sql-server-ver17) | referência do artigo | Formato colunar e compressão no SQL Server. | 6, 10 | 200 |
| [Apache Parquet: documentação](https://parquet.apache.org/docs/) | documentação | Formato colunar aberto. | 6 | 200 |
| [Apache Parquet: codificações](https://parquet.apache.org/docs/file-format/data-pages/encodings/) | documentação | Dicionário e repetição por coluna. | 10 | 200 |
| [Wikipedia: SGBD colunar](https://en.wikipedia.org/wiki/Column-oriented_DBMS) | outro | Visão geral de linha x coluna. | 6 | 200 |
| [ScyllaDB: banco de coluna larga](https://www.scylladb.com/glossary/wide-column-database/) | referência do artigo | Definição de wide-column. | 7 | 200 |
| [ScyllaDB: famílias de colunas do Cassandra](https://www.scylladb.com/glossary/cassandra-column-family/) | referência do artigo | Famílias de colunas. | 7 | 200 |
| [Chang et al.: Bigtable](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/) | fonte primária (artigo acadêmico) | Origem do modelo de coluna larga; memtable e SSTable. | 7, 11 | 200 |
| [Wikipedia: wide-column store](https://en.wikipedia.org/wiki/Wide-column_store) | outro | Diferença entre coluna larga e colunar. | 7 | 200 |
| [Redis: tipos de dados](https://redis.io/docs/latest/develop/data-types/) | documentação | Chave-valor com estruturas além de texto. | 8 | 200 |
| [Wikipedia: banco chave-valor](https://en.wikipedia.org/wiki/Key%E2%80%93value_database) | outro | Definição do modelo. | 8 | 200 |
| [Wikipedia: hashing consistente](https://en.wikipedia.org/wiki/Consistent_hashing) | outro | Como chaves se distribuem entre servidores. | 8, 13 | 200 |
| [Neo4j: o que é um banco de grafos](https://neo4j.com/docs/getting-started/get-started-with-neo4j/graph-database/) | documentação | Nós, arestas e propriedades. | 9 | 200 |
| [Wikipedia: banco de grafos](https://en.wikipedia.org/wiki/Graph_database) | outro | Definição e usos. | 9 | 200 |
| [MySQL: estrutura física de um índice do InnoDB](https://dev.mysql.com/doc/refman/8.0/en/innodb-physical-structure.html) | documentação | Página de 16 KB por padrão. Responde 200 ao User-Agent padrão do curl e 403 a 'Mozilla/5.0'. | 10, 12 | 200 (UA simples) |
| [O'Neil et al. (1996): The Log-Structured Merge-Tree](https://www.cs.umb.edu/~poneil/lsmtree.pdf) | fonte primária (artigo acadêmico) | Artigo original da LSM, com a comparação de custo de escrita. | 11 | 200 |
| [Apache Cassandra: storage engine](https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html) | documentação | Memtable, commit log, SSTable e LSM. | 11 | 200 |
| [RocksDB: compactação](https://github.com/facebook/rocksdb/wiki/Compaction) | documentação | Como a compactação funciona. | 11 | 200 |
| [Elhemali et al. (2022): Amazon DynamoDB, USENIX ATC](https://www.usenix.org/conference/atc22/presentation/elhemali) | fonte primária (artigo acadêmico) | Mostra que o DynamoDB usa B-tree e log, não LSM (correção das aulas 11 e 15). | 11, 15 | 200 |
| [PostgreSQL: índices B-Tree](https://www.postgresql.org/docs/current/btree.html) | documentação | B-Tree no PostgreSQL. | 12 | 200 |
| [PostgreSQL: usando EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) | documentação | Varredura contra índice no plano. | 12 | 200 |
| [Wikipedia: B-tree](https://en.wikipedia.org/wiki/B-tree) | outro | Estrutura da B-Tree e B+Tree. | 12 | 200 |
| [PostgreSQL: índices hash](https://www.postgresql.org/docs/current/hash-index.html) | documentação | Só o operador =; crash-safe desde a versão 10. | 13 | 200 |
| [Wikipedia: tabela hash](https://en.wikipedia.org/wiki/Hash_table) | outro | Baldes e colisões. | 13 | 200 |
| [PostgreSQL: índices GIN](https://www.postgresql.org/docs/current/gin.html) | documentação | GIN = Generalized Inverted Index. | 14 | 200 |
| [PostgreSQL: índices para busca de texto](https://www.postgresql.org/docs/current/textsearch-indexes.html) | documentação | Índice invertido de lexemas. | 14 | 200 |
| [Elastic: análise de texto](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html) | documentação | Normalização e tokenização. | 14 | 200 |
| [dev.to: índices invertidos](https://dev.to/surajvatsya/understanding-inverted-indexes-the-backbone-of-efficient-search-3hoe) | referência do artigo | Explicação introdutória. | 14 | 200 |
| [Wikipedia: índice invertido](https://en.wikipedia.org/wiki/Inverted_index) | outro | Definição. | 14 | 200 |
| [Fidelis: Replicação de Dados](https://fidelissauro.dev/replicacao/) | artigo do blog | Leitura seguinte para réplicas. | 15 | 200 |
| [Fidelis: Sharding e Particionamento](https://fidelissauro.dev/sharding/) | artigo do blog | Leitura seguinte para dividir dados. | 15 | 200 |
| [Fidelis: Cache](https://fidelissauro.dev/caching/) | artigo do blog | Camada de cache. | 15 | 200 |
| [Fidelis: CQRS](https://fidelissauro.dev/cqrs/) | artigo do blog | Separar escrita e leitura. | 15 | 200 |

## Referências do artigo que não foram citadas nas aulas

| Fonte | Motivo |
|---|---|
| [Banco de dados NoSQL, SQL e NewSQL (GeekHunter)](https://blog.geekhunter.com.br/banco-de-dados-nosql/) | 200. Texto introdutório que repete o que as aulas 2 e 3 já cobrem com fonte melhor. |
| [SQL vs NO SQL vs NEW SQL (GeeksforGeeks)](https://www.geeksforgeeks.org/dbms/sql-vs-no-sql-vs-new-sql/) | 200. Mesmo motivo. |
| [Clash of Database Technologies (Aaron Russell)](https://aaron-russell.co.uk/blog/sql-vs-nosql-vs-newsql/) | 200. Mesmo motivo. |
| [What is NewSQL? (Dremio)](https://www.dremio.com/wiki/newsql/) | 200 com User-Agent simples, 403 com "Mozilla/5.0". |
| [What is Time Series Database (The Customize Windows)](https://thecustomizewindows.com/2019/10/what-is-time-series-database-tsdb/) | 200. Texto superficial; a aula 2 usa a Wikipedia. |
| [Row-based vs. Column-based Indexes (LinkedIn)](https://www.linkedin.com/pulse/row-based-vs-column-based-indexes-ayman-elnory/) | 200. Post de rede social; a aula 6 cita a documentação do SQL Server e do Parquet. |
| [Last-Write-Wins in Database Systems (LinkedIn)](https://www.linkedin.com/pulse/last-write-wins-database-systems-yeshwanth-n-emc8c/) | 200. Mesmo motivo. |
| [Sequential Consistency in Distributed Systems (GeeksforGeeks)](https://www.geeksforgeeks.org/system-design/sequential-consistency-in-distributive-systems/) | 200. A aula 3 usa a Wikipedia. |

## Links que não abriram

| Fonte | Situação |
|---|---|
| [SQL, NoSQL ou New SQL? (Medium)](https://medium.com/@habbema/sql-no-ou-new-sql-b8059921cd5b) | 403 para robô com os dois User-Agents. Não citado. |
| [Understanding Hash Indexing in Databases (Medium)](https://medium.com/@rohmatmret/understanding-hash-indexing-in-databases-11c02b7d4ed1) | 403 para robô com os dois User-Agents. Não citado (a aula 13 usa a documentação do PostgreSQL). |
| [Edgar F. Codd (dblp)](https://dblp.org/pid/c/EFCodd.html) | Respondeu 202, sem conteúdo. Não citado. |
| [SQL, NewSQL, and NOSQL Databases: A Comparative Survey (IEEE)](https://ieeexplore.ieee.org/document/9078970) | Respondeu 202, sem conteúdo. Não citado. |
| [Choosing a Large or Small Page Size (IBExpert)](https://ibexpert.com/docu/doku.php?id=02-ibexpert:02-01-getting-started:registering-a-database:page-sizes) | Falha de conexão nos dois passes. Não citado; a aula 10 usa PostgreSQL, MySQL e SQL Server. |
| `aws.amazon.com/what-is/nosql/` | 404 (era candidato nosso, não do artigo). Não citado. |

## Fatos conferidos na fonte primária

| Afirmação | Fonte | Resultado |
|---|---|---|
| PostgreSQL usa página de 8 KB (fixada na compilação) | [documentação](https://www.postgresql.org/docs/current/storage-page-layout.html) | Confirmado |
| InnoDB usa página de 16 KB por padrão (definida na inicialização da instância) | [documentação](https://dev.mysql.com/doc/refman/8.0/en/innodb-physical-structure.html) | Confirmado |
| DynamoDB guarda os dados em B-tree com log de escrita antecipada | [artigo USENIX ATC 2022](https://www.usenix.org/conference/atc22/presentation/elhemali) | Confirmado: o texto não menciona LSM |
| Cassandra e Bigtable usam memtable, SSTable e LSM | [Cassandra](https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html), [Bigtable](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/) | Confirmado (ScyllaDB: o glossário dela fala de LSM, mas a memtable e o commit log não foram conferidos em doc da própria ScyllaDB) |
| InfluxDB usa TSM | [documentação](https://docs.influxdata.com/influxdb/v2/reference/internals/storage-engine/) | Parcial: a doc cita TSM e descreve cache, arquivos e compactação em níveis, mas não diz "LSM"; a aula 11 escreve "mesma família" |
| Índice hash do PostgreSQL só aceita `=` e é crash-safe desde a versão 10 | [documentação](https://www.postgresql.org/docs/current/hash-index.html), [notas da versão 10](https://www.postgresql.org/docs/10/release-10.html) | Confirmado |
| GIN é um índice invertido | [documentação](https://www.postgresql.org/docs/current/gin.html) | Confirmado |
| Parquet usa dicionário por coluna, com RLE sobre os índices | [documentação](https://parquet.apache.org/docs/file-format/data-pages/encodings/) | Confirmado (o RLE aparece junto do dicionário, não como codificação isolada) |
| Compactação do Cassandra descarta versões antigas e tombstones | [documentação](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/overview.html) | Confirmado. RocksDB: a wiki de compactação não traz a frase explícita |

## Correções feitas ao artigo-base

1. ACID: o artigo escreve "Integridade"; o I é **Isolamento** (aula 2).
2. Consistência forte é linearizabilidade; sequential consistency é um modelo mais fraco; e "todas as réplicas sempre retornam o mesmo dado" virou "toda leitura vê a última escrita confirmada" (aula 3).
3. "Consistência forte é CA": CA só existe sem rede entre os nós; um banco distribuído forte escolhe CP na partição (aula 3).
4. "Tudo o que não é forte é eventual": existe uma escada entre os dois, e quórum de maioria na escrita e na leitura segue forte (aula 3).
5. NoSQL "sem relacionamentos": o banco de grafos existe para relacionamentos (aulas 2 e 9).
6. Banco de documentos "com indexação invertida": usa B-Tree nos campos; o índice invertido é do motor de busca (aulas 5 e 14).
7. Wide-column não é colunar (aula 7).
8. LSM como trilha de auditoria: a compactação descarta versões antigas e tombstones (aula 11).
9. DynamoDB como LSM: o artigo do DynamoDB descreve B-tree e log; InfluxDB usa TSM, da mesma família (aulas 11 e 15).
10. B-Tree e B+Tree misturadas: bancos usam B+Tree (aula 12).
11. Hash "instantâneo": custo constante em média, com colisões, só para igualdade (aula 13).
12. Séries temporais "sem garantia de ler o que escreveu": é escolha de cada produto, não do tipo (aula 2).
13. Tamanho de página "configurável": no PostgreSQL é fixado na compilação e no SQL Server é sempre 8 KB (aula 10).
14. O brief dizia 37 links nas Referências; o artigo tem 21.
