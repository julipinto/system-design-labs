# Fontes: Modelos de Deployment

Registro dos links de fonte do módulo 22, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Estratégias de Deployment, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/deployment-strategies/), publicado em 06/03/2025 e citado nas aulas 1 a 4, 6, 8, 9, 11 e 12. Cópia do texto em `docs/escrita/deployment-strategies-artigo.txt`.

**Aulas:** 1 Deploy e rollback · 2 Big Bang (Recreate) · 3 Rolling updates · 4 Blue/Green · 5 Blue/Green, o exemplo do laboratório · 6 Canary releases · 7 Canary, o exemplo do laboratório · 8 Migrations e versões de dados · 9 Shadow traffic · 10 Shadow traffic, o exemplo do laboratório · 11 Feature flags · 12 Sharding, bulkheads e ring deployments

**Código:** o repositório público do autor tem `exemplos/deployment-methods/` (conferido com `gh api` em 20/10/2026): `blue-green/{simple,automated}`, `canary/{initial,simple,time,analysis}`, `shadow/{chip,shadow}.yml` e `project.yml`. **Não foi executado**: usa Argo CD, um chart Helm de um ChartMuseum interno, Istio e o domínio `homelab.fidelissauro.dev`, ou seja, só roda no homelab do autor, e aqui não há cluster. O que as aulas 5, 7 e 10 dizem dele vem da **leitura**, com os arquivos copiados sem alteração para `src/lab-code/deployment/` e mostrados com `CodeLab` e os números de linha do original. O `canary/initial` e o `canary/simple` são idênticos, menos a `version` (`v3` e `v4`).

**O que foi rodado** (20/10/2026): um PostgreSQL 14.24 local para a aula 8 (tabela `pedidos` de 1.000.000 de linhas de ~2 KB: `ADD COLUMN`, `UPDATE` inteiro e em lotes, fila de lock, `RENAME`, `CREATE INDEX` com e sem `CONCURRENTLY`) e as contas em Python e Node (arredondamento do Kubernetes e ondas do rolling, perdas, poder estatístico, buckets da flag com `murmur3`). Nesta etapa, o `murmur3` do widget (JS) foi conferido contra os vetores do brief (`"" → 0`, `"hello" → 0x248bfa47`, `"lena-77" → 0x8fd9d9d8`) e dá os buckets 19 · 38 · 3 · 94 · 41 (`frete_v2`) e 80 · 2 · 72 · 67 · 87 (`nova_home`) e 985 · 9.878 · 49.909 em 100.000 clientes; a simulação do rolling do widget dá 90 s para 3 pods (1 e 0) e 60 s e 8 prontos para 10 pods (3 e 2). **Não foram rodados:** o cluster Kubernetes/Argo/Istio e a análise de negócio adaptada (aula 7, sem cluster).

**Conferência feita em 2026-10-21:** os 31 links usados nas aulas deram 200 (curl com `User-Agent` de navegador, seguindo redirecionamentos).

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo de Matheus Fidelis](https://fidelissauro.dev/deployment-strategies/) | artigo base | Definição de deployment, rollback, a analogia da padaria, Recreate, Rolling, Blue/Green, Canary, migrations, shadow com `tx.Rollback()`, feature flags, clustering e sharding deployment. | 1–4, 6, 8, 9, 11, 12 | 200 |
| [Repositório do autor: exemplos/deployment-methods](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/deployment-methods) | código | O laboratório lido: `blueGreen`, `canary`, `analysis`, `mirror`. | 5, 7, 10 | 200 |
| [Kubernetes: Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) | documentação | `RollingUpdate` como padrão; `maxSurge` e `maxUnavailable` 25%, o primeiro arredonda para cima e o segundo para baixo; `Recreate`; `revisionHistoryLimit` 10; `progressDeadlineSeconds`; `rollout undo`. | 1, 2, 3, 12 | 200 |
| [Kubernetes: tutorial de atualização](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/) | tutorial | Rolling update na prática. | 3 | 200 |
| [Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) | padrão | Dois ambientes, a virada e o banco compartilhado. | 1, 4 | 200 |
| [Google SRE Workbook: Canarying Releases](https://sre.google/workbook/canarying-releases/) | livro | Comparar o canary com o controle no mesmo intervalo. | 1, 6 | 200 |
| [Kafka: KIP-429](https://cwiki.apache.org/confluence/display/KAFKA/KIP-429%3A+Kafka+Consumer+Incremental+Rebalance+Protocol) | proposta | Rebalance incremental (cooperativo) do consumidor. | 2 | 200 |
| [Documentação do Apache Kafka](https://kafka.apache.org/documentation/) | documentação | Grupos de consumidores e `group.instance.id`. | 2 | 200 |
| [Spacelift: estratégias de deployment no Kubernetes](https://spacelift.io/blog/kubernetes-deployment-strategies) | blog (referência do artigo) | Visão geral de recreate, rolling, blue/green e canary. Blog de fornecedor. | 3 | 200 |
| [Argo Rollouts: BlueGreen](https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/) | documentação | `activeService`, `previewService`, `autoPromotionEnabled`, `scaleDownDelaySeconds` (padrão 30 s), `prePromotionAnalysis`. | 4, 5 | 200 |
| [Glossário da CNCF: Blue/Green](https://glossary.cncf.io/pt-br/blue-green-deployment/) | glossário | Definição curta, em português. | 4 | 200 |
| [Red Hat: o que é blue/green](https://www.redhat.com/en/topics/devops/what-is-blue-green-deployment) | blog (referência do artigo) | Visão geral. Blog de fornecedor, "Aprofundar". | 4 | 200 |
| [Argo Rollouts: Analysis](https://argo-rollouts.readthedocs.io/en/stable/features/analysis/) | documentação | Modelos de análise, `Job` e Prometheus, `successCondition`, `failureLimit`, `count`, `interval`. | 5, 7 | 200 |
| [Prometheus: funções de consulta](https://prometheus.io/docs/prometheus/latest/querying/functions/) | documentação | `irate` só para gráficos de contadores voláteis; `rate` para regras e alertas. | 5, 7 | 200 |
| [Fowler: CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html) | padrão | A definição do canary e a relação com o shadow. | 6, 9 | 200 |
| [Argo Rollouts: Canary](https://argo-rollouts.readthedocs.io/en/stable/features/canary/) | documentação | Passos, `setWeight`, `pause`; sem `trafficRouting` o peso é aproximado pelo número de pods. | 6, 7 | 200 |
| [Flagger: progressive delivery com Istio](https://docs.flagger.app/tutorials/istio-progressive-delivery) | tutorial (referência do artigo) | Outra ferramenta de progressive delivery. | 6 | 200 |
| [Argo Rollouts: Istio](https://argo-rollouts.readthedocs.io/en/stable/features/traffic-management/istio/) | documentação | Peso exato pela malha. | 7 | 200 |
| [PostgreSQL 14: ALTER TABLE](https://www.postgresql.org/docs/14/sql-altertable.html) | documentação | Padrão não volátil fica nos metadados; padrão volátil reescreve a tabela. | 8 | 200 |
| [PostgreSQL: CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html) | documentação | `CONCURRENTLY`. | 8 | 200 |
| [PostgreSQL: configuração de cliente (`lock_timeout`)](https://www.postgresql.org/docs/current/runtime-config-client.html) | documentação | `lock_timeout`. | 8 | 200 |
| [PostgreSQL 14: bloqueios explícitos](https://www.postgresql.org/docs/14/explicit-locking.html) | documentação | `ACCESS EXCLUSIVE` e a fila de locks. | 8 | 200 |
| [Fowler: ParallelChange](https://martinfowler.com/bliki/ParallelChange.html) | padrão | Expandir e contrair. | 8 | 200 |
| [Istio: traffic mirroring](https://istio.io/latest/docs/tasks/traffic-management/mirroring/) | documentação | `mirror`, `mirrorPercentage`, sufixo `-shadow`, "fire and forget". | 9, 10 | 200 |
| [Envoy: route components (`RequestMirrorPolicy`)](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto) | referência | A política de espelho do proxy. | 9 | 200 |
| [Istio: VirtualService](https://istio.io/latest/docs/reference/config/networking/virtual-service/) | referência | `mirror` e `mirrorPercentage`. | 10 | 200 |
| [Fowler: Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) | artigo | Release, experiment, ops e permission toggles; dívida de flag. | 11 | 200 |
| [OpenFeature: especificação](https://openfeature.dev/specification/) | especificação | API padrão para avaliar flags. | 11 | 200 |
| [Split.io: canary release e feature flags](https://www.split.io/blog/canary-release-feature-flags/) | blog (referência do artigo) | Leitura de apoio. Fornecedor de flags: "Aprofundar". | 11 | 200 |
| [AWS Builders' Library: Automating safe, hands-off deployments](https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/) | artigo | *One-box*, ondas e *bake time*. | 12 | 200 |
| [Azure: Deployment Stamps](https://learn.microsoft.com/en-us/azure/architecture/patterns/deployment-stamp) | padrão | Carimbos (anéis) de implantação. | 12 | 200 |

## Não usados

- O texto do Christian Posta sobre *shadowing* no caminho do artigo devolve **404** (o blog responde 200 na raiz): não citado.
- O texto do Medium sobre k-means (referência do artigo) não foi conferido: não citado.
- Os outros textos do Split.io, Red Hat, Codefresh e Spacelift são blogs de fornecedores e ficam, no máximo, como "Aprofundar".

## Correções ao artigo (avisadas nas aulas)

1. **Recreate "só é viável com comunicação assíncrona e consistência eventual"** (aula 2): o critério é duas versões **não poderem coexistir** (ou a transição custar mais que a parada); o preço é o tempo fora do ar.
2. **Consumidores Kafka exigem Recreate** (aula 2): o rebalance cooperativo (KIP-429) e a associação estática reduzem o custo do rolling; o Recreate é uma opção.
3. **Rolling "sem validações intermediárias" e "não terão mais acesso à receita anterior"** (aula 3): há portões de saúde (`readinessProbe`, `minReadySeconds`, `progressDeadlineSeconds`, `rollout pause`); e o `rollout undo` volta (o código, não o dado).
4. **Blue/Green "redireciona instantaneamente" e "ambientes idênticos"** (aula 4): o ponteiro troca rápido, mas conexões abertas e o TTL do DNS atrasam o fluxo; o banco é um só.
5. **Canary em "semanas ou meses"** (aula 6): em software são minutos a horas, e o que decide é a amostra e a métrica de negócio; o SRE Workbook compara com o controle no mesmo intervalo.
6. **Migrations em dois parágrafos de definição** (aula 8): faltam expandir/contrair, backfill em lotes, `lock_timeout`, `CREATE INDEX CONCURRENTLY`, padrão volátil e a função de roteamento como dado.
7. **Shadow com `tx.Rollback()`** (aula 9): desfaz a transação do banco, não os efeitos fora dela (pagamentos, Kafka, e-mail); faltam o comparador e o custo de dobrar a carga.
8. **Feature flags** (aula 11): faltam dívida de flag, o padrão quando o serviço cai, a consistência da decisão por cliente e o ciclo de vida (Fowler).
9. **Clustering com k-means** (aula 12): descobre grupos, não risco; o primeiro anel sai de critério de negócio e clientes sintéticos.
10. **"Sharding Deployment"** (aula 12): o nome mais comum é ring deployment ou waves; dependências globais reintroduzem o raio de explosão global.
11. **Faltam no artigo** (aulas 1, 6, 8, 12): rollback ≠ restaurar dados; progressive delivery com ferramentas; poder estatístico; compatibilidade N/N−1 em eventos e APIs; congelamento de mudanças antes da Black Friday.
12. **Detalhe do laboratório (aula 5):** no `blue-green/automated`, a consulta de sucesso filtra pelo `chip-green` (só o preview), e o `scaleDownDelaySeconds: 60` está comentado (vale o padrão de 30 s). O brief resume o arquivo como "o mesmo com `prePromotionAnalysis`": a aula descreve o que o arquivo tem.
