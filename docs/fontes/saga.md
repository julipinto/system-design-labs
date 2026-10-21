# Fontes: Saga Pattern

Registro dos links de fonte do módulo 19, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Saga Pattern, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/saga-pattern/), publicado em 15/01/2025 e citado nas aulas 1 a 10.

**Aulas:** 1 Introdução e motivações · 2 O problema das transações longas e distribuídas · 3 A proposta arquitetural do Saga · 4 Saga coreografado · 5 Saga orquestrado · 6 State machines · 7 Fluxos de compensação · 8 Logs de saga · 9 Dual write · 10 Exemplo de sistema de pedidos distribuído

**Código:** o repositório público do autor tem `exemplos/saga/` só com `orquestrado/` (Go 1.23, Kafka em KRaft, 5 bancos PostgreSQL, 5 serviços e um `simulador`; conferido com `gh api` em 20/10/2026). **Não foi executado** (exige Docker e Kafka). O que as aulas 5 a 10 dizem dele vem da **leitura** de `orquestrador/main.go` e `estoque/main.go`, copiados sem alteração para `src/lab-code/saga/` e mostrados com `CodeLab` e os números de linha do original. As saídas reais de PostgreSQL 14.24 (log do `s-1057`, duplicata `f`, vigia) são de 20/10/2026; as contas (85,5%, 3.600, 31 s, 1.632.960.000 linhas) foram conferidas em Python e batem com os widgets.

**Conferência feita em 2026-10-20:** os 14 links usados nas aulas deram 200 (curl com `User-Agent` de navegador). O paper SAGAS (cópia em Cornell) é um PDF escaneado, sem texto pesquisável, e não foi lido.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo de Matheus Fidelis](https://fidelissauro.dev/saga-pattern/) | artigo base | Origem, transações distribuídas e longas, coreografia e orquestração, máquinas de estado, log, compensação, dual write, outbox, 2PC, reinício. | 1–10 | 200 |
| [Garcia-Molina e Salem: SAGAS (Cornell)](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf) | paper | Origem (1987) para transações longas dentro de um banco. PDF escaneado. | 1 | 200 |
| [microservices.io: Saga](https://microservices.io/patterns/data/saga.html) | padrão | Falta de rollback automático, falta de isolamento, contramedidas, coreografia como eventos de domínio. | 1–4, 7 | 200 |
| [Microsoft: Saga](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) | padrão | Visão geral, ordem e estados. | 1, 6, 10 | 200 |
| [Microsoft: arquitetura de referência da Saga](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga) | referência | Saga em sistemas distribuídos. | 2 | 200 |
| [Microsoft: Compensating Transaction](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction) | padrão | Passos idempotentes, "Compensating transactions don't always work", reembolso que pode não ser integral. | 3, 7 | 200 |
| [Temporal: Compensating actions](https://temporal.io/blog/compensating-actions-part-of-a-complete-breakfast-with-sagas) | blog | Ações compensatórias. | 3, 7 | 200 |
| [AWS: Saga choreography](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html) | guia | Coreografia. | 4 | 200 |
| [AWS: Saga orchestration](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html) | guia | Orquestração. | 5, 10 | 200 |
| [InfoQ: Saga Orchestration with Outbox](https://www.infoq.com/articles/saga-orchestration-outbox/) | artigo | Orquestração com outbox. | 5, 8, 9 | 200 |
| [Fowler: Two-Phase Commit](https://martinfowler.com/articles/patterns-of-distributed-systems/two-phase-commit.html) | padrão | Prepare e commit. | 2 | 200 |
| [Confluent: The Dual-Write Problem](https://www.confluent.io/blog/dual-write-problem/) | blog | Escrita dupla. | 9 | 200 |
| [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) | padrão | Outbox. | 9 | 200 |
| [Repositório do autor: saga/orquestrado](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/saga/orquestrado) | código | O laboratório lido. | 5–10 | 200 |

**Fora (não conferidos):** dev.to, Medium (três), dois vídeos, sofwancoder (TCC) e "8 types of sagas" (não abertos); SciTePress e MDPI (não abertos). Richardson, *Microservices Patterns* (livro), citado na aula 3 sem link.

## Correções ao artigo (avisadas nas aulas)
1. **Pseudoatômica e rollback (aulas 1, 3).** Atomicidade por compensação, não por rollback; sem isolamento (ACD sem I); sem rollback automático; contramedidas ausentes.
2. **Compensação (aulas 3, 7).** Não é desfazer exato: pode ser outra transação, pode não devolver tudo, tem de ser idempotente e repetível, às vezes falha. Faltam compensável, pivô e repetível.
3. **Coreografia (aula 4).** O serviço publica o fato e não sabe quem escuta; chamar o próximo é cadeia ponto a ponto. A dificuldade real é não ter dono do fluxo.
4. **Dual write por transação (aula 9).** Publicar dentro da transação e só dar commit depois não é atômico; a solução é outbox e CDC.
5. **2PC na saga (aula 2).** São alternativas; o 2PC bloqueia e exige prepare (PSP e Kafka não têm).
6. **Origem (aula 1).** 1987, SIGMOD, transações longas dentro de um banco; PDF escaneado, texto não conferido.
7. **Faltas (aulas 6, 9, 10).** Prazo por estado e vigia, ordem dos passos, idempotência do comando, correlação, passo humano, TCC.
8. **Laboratório lido (aulas 5–10).** Avanço pelo tópico sem conferir o estado, compensações esquecidas e `FAILED` antes delas, comando antes do estado, sem vigia nem idempotência, `CANCEL_DELIVERY` nunca enviado, README chama o log de event sourcing. Extra: o README lista `CANCEL_PAYMENT` na falha do pagamento, mas pelo código só sai `RELEASE_STOCK` e `CANCEL_ORDER` (estado `STOCK_RESERVED`).
9. **Referências (aula 1).** As não conferidas ficam de fora.
