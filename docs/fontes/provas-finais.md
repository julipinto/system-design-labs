# Fontes: Provas Finais

Registro dos links do módulo 29. Não há artigo-base: o módulo é a revisão do estudo, e a fonte são os briefs dos módulos 1 a 28 (`docs/escrita/<módulo>-brief.md`) e `docs/escrita/historia-mestre.md`. Os números e nomes já existem nos módulos anteriores; as únicas coisas novas são a ordem de montagem, os 7 blocos, o quiz geral e o mapa da loja.

**Aulas:** 1 A loja de um servidor · 2 Partir e ligar · 3 Conversar e disputar · 4 Crescer e espalhar · 5 Consistência e resiliência · 6 Mudar, planejar, testar, isolar · 7 Células, desastre e sinais

**Em todas as aulas:** links internos (`withBase('labs/<slug>/')`) para cada módulo do bloco: 1 `protocolos-de-rede`, `storage-raid-io`, `cap-acid-base`, `databases`, `cache`; 2 `microsservicos`, `load-balancers`, `api-gateways`, `bff`, `service-mesh`; 3 `concorrencia`, `comunicacao-sincrona`, `comunicacao-assincrona`; 4 `performance`, `scale-cube`, `sharding`, `replicacao`; 5 `cqrs`, `saga`, `event-sourcing`, `resiliencia`; 6 `deployment`, `capacity-planning`, `testes-de-carga`, `bulkhead`; 7 `cell-based`, `disaster-recovery`, `observabilidade`.

## Externos (só em "Aprofundar")
| Link | O que tem de útil | Aula |
|---|---|---|
| https://sre.google/sre-book/table-of-contents/ | sumário do livro de SRE (monitoramento, sinais de ouro, escalabilidade) | 4, 7 |
| https://aws.amazon.com/builders-library/ | artigos de engenharia sobre escala e disponibilidade | 4 |
| https://learn.microsoft.com/en-us/azure/architecture/patterns/ | catálogo de padrões (CQRS, Saga, Event Sourcing, Circuit Breaker, Retry) | 5 |
| https://martinfowler.com/articles/patterns-of-distributed-systems/ | Patterns of Distributed Systems | 5 |
| https://sre.google/workbook/table-of-contents/ | sumário do SRE Workbook (rollouts, capacidade, testes) | 6 |
| https://aws.amazon.com/architecture/well-architected/ | pilares de confiabilidade e eficiência | 6 |
| https://learn.microsoft.com/en-us/azure/well-architected/ | Azure Well-Architected Framework | 7 |

## Depois do módulo (aula 7)
Repositório do autor, pasta `cases/` (casos de desenho para repetir o método com outro sistema): [pasta](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/cases) · [BASICO_CHECKOUT_LIVRARIA](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/BASICO_CHECKOUT_LIVRARIA.md) · [INTERMEDIARIO_ESTOQUE](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/INTERMEDIARIO_ESTOQUE.md). Também abrem, e não entram nas aulas: `INTERMEDIARIO_SAGA.md` e `AVANCADO_RESERVA_ONLINE.md`.

**Correções recapituladas** (de módulos anteriores, em "Aprofundar"): módulos 5, 12, 16, 21, 22, 25, 26, 27 e 28 (9 no total), todas vindas dos briefs deles.

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 10 links externos usados nas aulas deram 200 (os 2 casos que não entram no texto foram conferidos no brief, com 200). Sem link verificável: nenhum livro citado.

**Contas:** as 80 respostas do quiz vêm das constantes dos briefs; as de um passo foram recalculadas (0,9 × 1 + 0,1 × 41 = 5; 50 ÷ 30 = 1,67; 0,9 × 0,95 = 0,855; (9 × 64 + 99) ÷ 10 = 67,5; 9,9 × 0,3 = 2,97; 0,3 × 2 + 0,7 × 275 = 193,1; 2.700 ÷ 12.960 = 20,8%; 1 ÷ 45 = 2,2%; 30 × 0,8 = 24; 0,001 × 43.200 = 43,2). Os módulos 26, 27 e 28 foram conferidos só contra os briefs, porque as aulas deles estavam em outros worktrees (`sdlabs-m26`, `m27`, `m28`) quando este módulo foi escrito.
