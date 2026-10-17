# Fontes: CAP, ACID e BASE

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [Teorema CAP, ACID e BASE, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/teorema-cap/), citada nas aulas 1 a 6. A aula 7 usa o artigo dele sobre PACELC, em [fidelissauro.dev/pacelc](https://fidelissauro.dev/pacelc/).

**Aulas:** 1 Teorema CAP · 2 Modelo ACID · 3 Modelo BASE · 4 Componentes do CAP · 5 Combinações do Modelo CAP (CP, AP, CA) · 6 Críticas Modernas ao modelo CAP · 7 Teorema PACELC

Conferência feita em 2026-10-17: 17 links, todos com status 200.

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Teorema CAP, ACID e BASE, Matheus Fidelis](https://fidelissauro.dev/teorema-cap/) | artigo base | Base do módulo: as aulas 1 a 6 seguem a ordem dele. | 1, 2, 3, 4, 5, 6 | 200 |
| [PACELC, Matheus Fidelis](https://fidelissauro.dev/pacelc/) | artigo base | Base da aula 7, com a classificação PA/EL, PC/EC e as demais combinações. | 7 | 200 |
| [Brewer (2012): CAP Twelve Years Later, na InfoQ](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/) | outro (texto de Brewer) | Brewer revisa o CAP doze anos depois; a aula 6 usa essa revisão. | 1, 6 | 200 |
| [Kleppmann (2015): pare de chamar bancos de CP ou AP](https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html) | outro (texto de Kleppmann) | Define C, A e P com precisão e critica os rótulos CP e AP, usados nas aulas 4 e 6. | 4, 6 | 200 |
| [Kleppmann: testando o I do ACID (Hermitage)](https://martin.kleppmann.com/2014/11/25/hermitage-testing-the-i-in-acid.html) | outro (texto de Kleppmann) | Mostra como os níveis de isolamento se comportam nas anomalias testadas na aula 2. | 2 | 200 |
| [Kleppmann (2015): uma crítica ao teorema CAP (arXiv)](https://arxiv.org/abs/1509.05393) | outro (artigo acadêmico) | Crítica de Kleppmann ao teorema CAP, com a ideia de olhar para as invariantes; base da aula 6. | 6 | 200 |
| [Abadi (2010): problemas com o CAP](http://dbmsmusings.blogspot.com/2010/04/problems-with-cap-and-yahoos-little.html) | outro (texto de Abadi) | Argumento de Abadi de que CP e CA quase se confundem numa partição; citado nas aulas 5 e 7. | 5, 7 | 200 |
| [Abadi (2010): Consistency Tradeoffs in Modern Distributed Database System Design (PDF)](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf) | outro (artigo acadêmico) | Artigo original do PACELC, de onde sai a classificação da aula 7. | 7 | 200 |
| [PostgreSQL: níveis de isolamento de transação](https://www.postgresql.org/docs/current/transaction-iso.html) | documentação | Documenta os níveis de isolamento; a aula 2 cita o Read Committed como padrão. | 2 | 200 |
| [AWS: o teorema CAP (whitepaper)](https://docs.aws.amazon.com/pt_br/whitepapers/latest/availability-and-beyond-improving-resilience/cap-theorem.html) | documentação | Definição de CAP em documento oficial da AWS, de apoio à aula 4. | 4 | 200 |
| [Wikipedia: MVCC](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) | referência do artigo | Explica o controle de concorrência por versões, usado na aula 2. | 2 | 200 |
| [Wikipedia: two-phase commit](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) | referência do artigo | Explica o commit em duas fases da aula 2. | 2 | 200 |
| [Wikipedia: CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) | referência do artigo | Tipos de dado que convergem sem conflito, citados na aula 3 e na conciliação do AP da aula 5. | 3 | 200 |
| [Alex DeBrie: consistência eventual no DynamoDB](https://www.alexdebrie.com/posts/dynamodb-eventual-consistency/) | referência do artigo | Explica a consistência eventual num banco real, de apoio à aula 3. | 3 | 200 |
| [IBM: o que é o teorema CAP](https://www.ibm.com/br-pt/topics/cap-theorem) | referência do artigo | Definição geral do teorema CAP, em português, de apoio às aulas 1 e 5. | 1, 5 | 200 |
| [Wikipedia: PACELC design principle](https://en.wikipedia.org/wiki/PACELC_design_principle) | referência do artigo | Descrição do princípio PACELC, de apoio à aula 7. | 7 | 200 |
| [ScyllaDB: glossário do PACELC](https://www.scylladb.com/glossary/pacelc-theorem/) | referência do artigo | Resumo do PACELC com exemplos de bancos, de apoio à aula 7. | 7 | 200 |

## Links que não abriram

Nenhum. Todos os 17 links retornaram 200.
